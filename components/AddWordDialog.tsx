import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Minus, Wand2, Mic, Volume2 } from 'lucide-react';
import { addUserWord } from '@/lib/glossary';
import { useAuth } from '@/app/AuthContext';
import { toast } from 'sonner';

interface AddWordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWordAdded: () => void;
}

export function AddWordDialog({ open, onOpenChange, onWordAdded }: AddWordDialogProps) {
  const { user } = useAuth();
  const [word, setWord] = useState('');
  const [definition, setDefinition] = useState('');
  const [phoneticSpelling, setPhoneticSpelling] = useState('');
  const [rating, setRating] = useState<'+' | '-' | '~'>('~');
  const [grade, setGrade] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error('You must be logged in to add words');
      return;
    }

    setIsLoading(true);
    try {
      const newWord = {
        word: word.trim(),
        definition: definition.trim(),
        phonetic_spelling: phoneticSpelling.trim(),
        rating,
        grade,
        source: 'user',
        version: 'User',
        user_id: user.uid
      };

      const result = await addUserWord(newWord);
      if (result) {
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

  const resetForm = () => {
    setWord('');
    setDefinition('');
    setPhoneticSpelling('');
    setRating('~');
    setGrade(1);
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
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Add New Word</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePhonetic}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
                  title="Generate phonetic spelling"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
                  title="Record pronunciation"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
                  title="Play pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </Label>
            <Input
              id="phonetic"
              value={phoneticSpelling}
              onChange={(e) => setPhoneticSpelling(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5"
              placeholder="e.g., /ˈfəʊniːm/"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Rating</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRating('+')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    rating === '+' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Positive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRating('~')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    rating === '~'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>Neutral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRating('-')}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    rating === '-'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Negative</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade" className="text-gray-700 dark:text-gray-300">Grade (1-10)</Label>
              <Input
                id="grade"
                type="number"
                min="1"
                max="10"
                value={grade}
                onChange={(e) => setGrade(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full bg-gray-50 dark:bg-white/5"
              />
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
              {isLoading ? 'Adding...' : 'Add Word'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 