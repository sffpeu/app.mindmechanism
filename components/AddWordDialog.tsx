import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Minus, Wand2 } from 'lucide-react';
import { addUserWord, updateUserWord } from '@/lib/glossary';
import { useAuth } from '@/lib/FirebaseAuthContext';
import { toast } from 'sonner';
import { useSoundEffects } from '@/lib/sounds';
import { GlossaryWord } from '@/types/Glossary';

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
  const [rating, setRating] = useState<'+' | '-' | '~'>('~');
  const [grade, setGrade] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = Boolean(editWord?.id);

  useEffect(() => {
    if (open) {
      if (editWord) {
        setWord(editWord.word);
        setDefinition(editWord.definition);
        setPhoneticSpelling(editWord.phonetic_spelling ?? '');
        setRating(editWord.rating);
        setGrade(editWord.grade);
      } else {
        resetForm();
      }
    } else {
      resetForm();
    }
  }, [open, editWord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error('You must be logged in to add or edit words');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && editWord?.id) {
        const result = await updateUserWord(editWord.id, {
          word: word.trim(),
          definition: definition.trim(),
          phonetic_spelling: phoneticSpelling.trim(),
          rating,
          grade,
          source: 'user',
          version: 'User',
          user_id: user.uid
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
      } else {
        const newWord = {
          word: word.trim(),
          definition: definition.trim(),
          phonetic_spelling: phoneticSpelling.trim(),
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
      }
    } catch (error) {
      console.error('Error saving word:', error);
      toast.error(isEditMode ? 'Failed to update word' : 'Failed to add word');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setWord('');
    setDefinition('');
    setPhoneticSpelling('');
    setRating('~');
    setGrade(3);
  };

  const handleGeneratePhonetic = () => {
    // This is a simple example - in production you'd want to use a proper API
    const phonetic = word.split('').map(char => {
      const vowels = 'aeiou';
      return vowels.includes(char.toLowerCase()) ? 'ə' : char;
    }).join('');
    setPhoneticSpelling(phonetic);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-black border border-gray-200 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Word' : 'Add New Word'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="word" className="text-gray-700 dark:text-gray-300">
                Word
              </Label>
              <div className="relative">
                <Input
                  id="word"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5"
                  placeholder="Enter a word"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="definition" className="text-gray-700 dark:text-gray-300">
                Definition
              </Label>
              <Textarea
                id="definition"
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 min-h-[100px]"
                placeholder="Enter the word's definition"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phonetic" className="text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>Phonetic Spelling</span>
                <button
                  type="button"
                  onClick={handleGeneratePhonetic}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
                  title="Generate phonetic spelling"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
              </Label>
              <Input
                id="phonetic"
                value={phoneticSpelling}
                onChange={(e) => setPhoneticSpelling(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5"
                placeholder="e.g., /ˈfəʊniːm/"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-gray-700 dark:text-gray-300">Word Assessment</Label>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRating('+')}
                        className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-all ${
                          rating === '+' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500' 
                            : 'bg-white dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black/60 border border-gray-200 dark:border-white/10'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="font-medium">+</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating('~')}
                        className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-all ${
                          rating === '~'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-500'
                            : 'bg-white dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black/60 border border-gray-200 dark:border-white/10'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                        <span className="font-medium">~</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating('-')}
                        className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-all ${
                          rating === '-'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500'
                            : 'bg-white dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black/60 border border-gray-200 dark:border-white/10'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span className="font-medium">-</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGrade(prev => Math.max(1, prev - 1))}
                        className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black/60 border border-gray-200 dark:border-white/10 transition-colors text-lg font-medium"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white w-5 text-center">{grade}</span>
                      <button
                        type="button"
                        onClick={() => setGrade(prev => Math.min(5, prev + 1))}
                        className="h-10 w-10 rounded-lg flex items-center justify-center bg-white dark:bg-black/40 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black/60 border border-gray-200 dark:border-white/10 transition-colors text-lg font-medium"
                      >
                        +
                      </button>
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
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-gray-50 dark:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              >
                {isLoading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Word')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 