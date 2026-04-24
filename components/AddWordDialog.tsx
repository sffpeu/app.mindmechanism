import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Minus, UserCircle2, Mic, MicOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addUserWord, updateUserWord, fetchIpaPhonetic } from '@/lib/glossary';
import { useAuth } from '@/lib/FirebaseAuthContext';
import { toast } from 'sonner';
import { useSoundEffects } from '@/lib/sounds';
import { GlossaryWord, SUPPORTED_LANGUAGES } from '@/types/Glossary';
import { cn } from '@/lib/utils';

interface AddWordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWordAdded: () => void;
  editWord?: GlossaryWord | null;
}

export function AddWordDialog({ open, onOpenChange, onWordAdded, editWord }: AddWordDialogProps) {
  const { user } = useAuth();
  const { playSuccess } = useSoundEffects();
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [phoneticSpelling, setPhoneticSpelling] = useState('');
  const [language, setLanguage] = useState('en');
  const [rating, setRating] = useState<'+' | '-' | '~'>('~');
  const [grade, setGrade] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPhonetic, setIsFetchingPhonetic] = useState(false);
  const [showOverwriteChoice, setShowOverwriteChoice] = useState(false);
  const isEditMode = Boolean(editWord?.id);

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState<'word' | 'definition' | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      if (editWord) {
        setWord(editWord.word);
        setDefinition(editWord.definition);
        setPhoneticSpelling(editWord.phonetic_spelling ?? '');
        setLanguage(editWord.language ?? 'en');
        setRating(editWord.rating);
        setGrade(editWord.grade);
      } else {
        resetForm();
      }
    } else {
      resetForm();
      stopVoice();
    }
  }, [open, editWord]);

  // Auto-fetch IPA when word field loses focus
  const handleWordBlur = async () => {
    if (!word.trim() || phoneticSpelling) return;
    setIsFetchingPhonetic(true);
    const ipa = await fetchIpaPhonetic(word.trim(), language);
    if (ipa) setPhoneticSpelling(ipa);
    setIsFetchingPhonetic(false);
  };

  // Re-fetch IPA if language changes while word is set and phonetic is empty
  useEffect(() => {
    if (!open || !word.trim() || phoneticSpelling) return;
    let cancelled = false;
    setIsFetchingPhonetic(true);
    fetchIpaPhonetic(word.trim(), language).then((ipa) => {
      if (!cancelled && ipa) setPhoneticSpelling(ipa);
      if (!cancelled) setIsFetchingPhonetic(false);
    });
    return () => { cancelled = true; };
  }, [language]);

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceTarget(null);
    setInterimTranscript('');
  };

  const toggleVoice = (target: 'word' | 'definition') => {
    if (isListening) {
      stopVoice();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice input not supported — please use Chrome or Safari.');
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Use the selected language for the recognition locale where possible
    recognition.lang = language === 'pt-BR' ? 'pt-BR' : language === 'other' ? 'en-US' : `${language}-${language.toUpperCase()}`;
    // Override with known correct locale tags
    const localeMap: Record<string, string> = {
      en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
      it: 'it-IT', ru: 'ru-RU', ar: 'ar-SA', hi: 'hi-IN',
      ja: 'ja-JP', ko: 'ko-KR', tr: 'tr-TR', zh: 'zh-CN',
    };
    recognition.lang = localeMap[language] ?? 'en-US';

    recognition.onresult = (event: any) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript;
        } else {
          interimChunk += event.results[i][0].transcript;
        }
      }
      if (finalChunk) {
        const chunk = finalChunk.trim();
        if (target === 'word') {
          setWord((prev) => (prev ? prev + ' ' : '') + chunk);
        } else {
          setDefinition((prev) => (prev ? prev + ' ' : '') + chunk);
        }
        setInterimTranscript('');
      } else {
        setInterimTranscript(interimChunk);
      }
    };
    recognition.onerror = stopVoice;
    recognition.onend = stopVoice;
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setVoiceTarget(target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error('You must be logged in to add or edit words');
      return;
    }
    if (isEditMode && editWord?.id) {
      setShowOverwriteChoice(true);
      return;
    }
    await doAddWord();
  };

  const doOverwrite = async () => {
    if (!editWord?.id || !user?.uid) return;
    setIsLoading(true);
    setShowOverwriteChoice(false);
    try {
      const result = await updateUserWord(editWord.id, {
        word: word.trim(),
        definition: definition.trim(),
        phonetic_spelling: phoneticSpelling.trim(),
        language,
        rating,
        grade,
        source: 'system',
        version: 'Default'
      });
      if (result) {
        playSuccess();
        toast.success('Word updated successfully');
        onWordAdded();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error('Failed to update word');
      }
    } catch (error) {
      console.error('Error updating word:', error);
      toast.error('Failed to update word');
    } finally {
      setIsLoading(false);
    }
  };

  const doAddWord = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    if (showOverwriteChoice) setShowOverwriteChoice(false);
    try {
      const newWord = {
        word: word.trim(),
        definition: definition.trim(),
        phonetic_spelling: phoneticSpelling.trim(),
        language,
        rating,
        grade,
        source: 'user' as const,
        version: 'User' as const,
        user_id: user.uid
      };
      const result = await addUserWord(newWord);
      if (result) {
        playSuccess();
        toast.success('Word added successfully');
        onWordAdded();
        onOpenChange(false);
        resetForm();
      } else {
        toast.error('Failed to add word');
      }
    } catch (error) {
      console.error('Error adding word:', error);
      toast.error('Failed to add word');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsNew = async () => {
    if (!user?.uid) return;
    await doAddWord();
  };

  const resetForm = () => {
    setWord('');
    setDefinition('');
    setPhoneticSpelling('');
    setLanguage('en');
    setRating('~');
    setGrade(3);
    setInterimTranscript('');
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(open) => { if (!open) setShowOverwriteChoice(false); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-black border border-gray-200 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Word' : 'Add Word'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-gray-50 dark:bg-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Word + voice */}
          <div className="space-y-2">
            <Label htmlFor="word" className="text-gray-700 dark:text-gray-300">Word</Label>
            <div className="flex gap-2">
              <Input
                id="word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onBlur={handleWordBlur}
                className="flex-1 bg-gray-50 dark:bg-white/5"
                placeholder="Enter a word"
                required
              />
              <button
                type="button"
                onClick={() => toggleVoice('word')}
                title={isListening && voiceTarget === 'word' ? 'Stop recording' : 'Dictate word'}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg border-2 shrink-0 transition-all',
                  isListening && voiceTarget === 'word'
                    ? 'border-transparent animate-pulse bg-violet-500 text-white'
                    : 'border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white'
                )}
              >
                {isListening && voiceTarget === 'word' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* IPA phonetic — auto-filled, always editable */}
          <div className="space-y-2">
            <Label htmlFor="phonetic" className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              IPA Phonetic
              {isFetchingPhonetic && (
                <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 animate-pulse">fetching…</span>
              )}
            </Label>
            <Input
              id="phonetic"
              value={phoneticSpelling}
              onChange={(e) => setPhoneticSpelling(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 font-mono"
              placeholder={language === 'other' ? 'Enter IPA manually e.g. /ˈwɜːd/' : 'Auto-fills from dictionary — edit freely'}
            />
          </div>

          {/* Definition + voice */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="definition" className="text-gray-700 dark:text-gray-300">Definition</Label>
              <button
                type="button"
                onClick={() => toggleVoice('definition')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all',
                  isListening && voiceTarget === 'definition'
                    ? 'border-transparent animate-pulse bg-violet-500 text-white'
                    : 'border-gray-200 dark:border-white/15 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                )}
              >
                {isListening && voiceTarget === 'definition'
                  ? <><MicOff className="h-3.5 w-3.5" /><span>Stop</span></>
                  : <><Mic className="h-3.5 w-3.5" /><span>Voice</span></>
                }
              </button>
            </div>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 min-h-[100px]"
              placeholder="Enter the word's definition"
              required
            />
            {isListening && voiceTarget === 'definition' && (
              <p className="text-xs italic text-violet-500 dark:text-violet-400 px-1 min-h-[1.25rem]">
                {interimTranscript || 'Listening…'}
              </p>
            )}
          </div>

          {/* Assessment */}
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300">Assessment</Label>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(['+', '~', '-'] as const).map((r) => {
                    const icons = { '+': ThumbsUp, '~': Minus, '-': ThumbsDown }
                    const Icon = icons[r]
                    const active = {
                      '+': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500',
                      '~': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-500',
                      '-': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500',
                    }[r]
                    const inactive = 'bg-white dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black/60 border border-gray-200 dark:border-white/10'
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRating(r)}
                        className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-all ${rating === r ? active : inactive}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{r}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGrade(prev => Math.max(1, prev - 1))}
                    className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black/60 border border-gray-200 dark:border-white/10 transition-colors text-lg font-medium"
                  >-</button>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white w-5 text-center">{grade}</span>
                  <button
                    type="button"
                    onClick={() => setGrade(prev => Math.min(5, prev + 1))}
                    className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black/60 border border-gray-200 dark:border-white/10 transition-colors text-lg font-medium"
                  >+</button>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:dark:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-gray-50 dark:bg-white/5">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            >
              {isLoading ? (isEditMode ? 'Saving…' : 'Adding…') : (isEditMode ? 'Save Changes' : 'Add Word')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={showOverwriteChoice} onOpenChange={setShowOverwriteChoice}>
      <DialogContent className="sm:max-w-[400px] bg-white dark:bg-black border border-gray-200 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Save changes</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
          Overwrite the existing word or save as a new word?
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button type="button" onClick={doOverwrite} disabled={isLoading} variant="outline" className="w-full justify-start gap-3 h-11">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0">D</span>
            Overwrite existing word
          </Button>
          <Button type="button" onClick={handleAddAsNew} disabled={isLoading} className="w-full justify-start gap-3 h-11 bg-purple-600 hover:bg-purple-700 text-white">
            <UserCircle2 className="w-5 h-5 text-white shrink-0" />
            Save as new word
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={() => setShowOverwriteChoice(false)} className="w-full mt-2">Cancel</Button>
      </DialogContent>
    </Dialog>
    </>
  );
}
