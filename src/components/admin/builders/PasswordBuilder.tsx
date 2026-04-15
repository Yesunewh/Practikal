import { useState } from 'react';
import { Lock, Check, X } from 'lucide-react';

interface PasswordBuilderProps {
  onSave: (stepData: any) => void;
  onCancel: () => void;
}

export default function PasswordBuilder({ onSave, onCancel }: PasswordBuilderProps) {
  const [minLength, setMinLength] = useState(12);
  const [requireCapital, setRequireCapital] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(true);
  const [explanation, setExplanation] = useState('');
  const [testPassword, setTestPassword] = useState('');

  // Password validation for preview
  const validatePassword = (password: string) => {
    return {
      length: password.length >= minLength,
      capital: !requireCapital || /[A-Z]/.test(password),
      number: !requireNumber || /[0-9]/.test(password),
      special: !requireSpecial || /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const validation = validatePassword(testPassword);
  const allValid = Object.values(validation).every(v => v);

  const handleSave = () => {
    const stepData = {
      type: 'password-create',
      content: {
        minLength,
        requireCapital,
        requireNumber,
        requireSpecial
      },
      explanation
    };

    onSave(stepData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Password Challenge Builder</h3>
        <p className="text-sm text-gray-500">Set password requirements and validation rules</p>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-700 mb-4">Password Requirements</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Length: {minLength} characters
              </label>
              <input
                type="range"
                min="8"
                max="20"
                value={minLength}
                onChange={(e) => setMinLength(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>8</span>
                <span>20</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={requireCapital}
                  onChange={(e) => setRequireCapital(e.target.checked)}
                  className="h-5 w-5 text-emerald-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Require Uppercase Letter</span>
                  <p className="text-xs text-gray-500">At least one capital letter (A-Z)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={requireNumber}
                  onChange={(e) => setRequireNumber(e.target.checked)}
                  className="h-5 w-5 text-emerald-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Require Number</span>
                  <p className="text-xs text-gray-500">At least one digit (0-9)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={requireSpecial}
                  onChange={(e) => setRequireSpecial(e.target.checked)}
                  className="h-5 w-5 text-emerald-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">Require Special Character</span>
                  <p className="text-xs text-gray-500">At least one symbol (!@#$%^&*)</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <h4 className="font-medium text-gray-700 mb-4">Live Preview</h4>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lock size={20} className="text-emerald-600" />
                <h5 className="font-semibold text-gray-800">Create a Strong Password</h5>
              </div>

              <input
                type="password"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 mb-4"
                placeholder="Test password here..."
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
              />

              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-sm ${validation.length ? 'text-green-600' : 'text-gray-400'}`}>
                  {validation.length ? <Check size={16} /> : <X size={16} />}
                  <span>At least {minLength} characters</span>
                </div>
                {requireCapital && (
                  <div className={`flex items-center gap-2 text-sm ${validation.capital ? 'text-green-600' : 'text-gray-400'}`}>
                    {validation.capital ? <Check size={16} /> : <X size={16} />}
                    <span>Contains uppercase letter</span>
                  </div>
                )}
                {requireNumber && (
                  <div className={`flex items-center gap-2 text-sm ${validation.number ? 'text-green-600' : 'text-gray-400'}`}>
                    {validation.number ? <Check size={16} /> : <X size={16} />}
                    <span>Contains number</span>
                  </div>
                )}
                {requireSpecial && (
                  <div className={`flex items-center gap-2 text-sm ${validation.special ? 'text-green-600' : 'text-gray-400'}`}>
                    {validation.special ? <Check size={16} /> : <X size={16} />}
                    <span>Contains special character</span>
                  </div>
                )}
              </div>

              {testPassword && (
                <div className={`mt-4 p-3 rounded-lg ${allValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm font-medium ${allValid ? 'text-green-700' : 'text-red-700'}`}>
                    {allValid ? '✓ Password meets all requirements!' : '✗ Password does not meet requirements'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (optional)</label>
        <textarea
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          placeholder="Explain why these requirements are important..."
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
        >
          Add Password Step
        </button>
      </div>
    </div>
  );
}
