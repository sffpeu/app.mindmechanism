import { Mail } from 'lucide-react';

interface ConfirmEmailDialogProps {
  email: string;
  onClose?: () => void;
}

export function ConfirmEmailDialog({ email, onClose }: ConfirmEmailDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black rounded-lg p-8 max-w-md w-full mx-4 shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-300" />
          </div>
          
          <h2 className="text-2xl font-bold text-center dark:text-white">Check your email</h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-center">
            We sent a confirmation link to <span className="font-medium text-black dark:text-white">{email}</span>
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Click the link in the email to confirm your account. If you don't see it, check your spam folder.
          </p>

          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 