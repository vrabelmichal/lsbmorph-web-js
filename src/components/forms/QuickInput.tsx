import React, { useState, useEffect } from 'react';

interface QuickInputProps {
  onUpdate: (values: any) => void;
}

export const QuickInput: React.FC<QuickInputProps> = ({ onUpdate }) => {
  const [input, setInput] = useState('');

  const parseInput = (inputText: string) => {
    let cleanedInput = '';
    for (const char of inputText.toLowerCase()) {
      if (['-', '0', '1', '2', 'r', 'a', 'c', 'm'].includes(char)) {
        cleanedInput += char;
      }
    }

    if (cleanedInput !== inputText) {
      setInput(cleanedInput);
    }

    // Parse LSB class (first relevant character)
    let lsbClass = '';
    let morphology = '';
    let foundLsb = false;

    for (let i = 0; i < cleanedInput.length; i++) {
      const char = cleanedInput[i];
      
      if (!foundLsb && ['-', '0', '1'].includes(char)) {
        if (char === '-' && i + 1 < cleanedInput.length && cleanedInput[i + 1] === '1') {
          lsbClass = '-1';
          i++; // Skip next character
        } else {
          lsbClass = char;
        }
        foundLsb = true;
        continue;
      }

      // Look for morphology after LSB class
      if (foundLsb && ['-', '0', '1', '2'].includes(char) && morphology === '') {
        if (char === '-' && i + 1 < cleanedInput.length && cleanedInput[i + 1] === '1') {
          morphology = '-1';
          i++;
        } else {
          morphology = char;
        }
        break;
      }
    }

    const values = {
      lsbClass: lsbClass ? parseInt(lsbClass) : '',
      morphology: morphology ? parseInt(morphology) : '',
      validRedshift: cleanedInput.includes('r'),
      awesomeFlag: cleanedInput.includes('a'),
    };

    onUpdate(values);

    // Handle contrast toggle
    if (cleanedInput.includes('c')) {
      // Trigger contrast change
      document.dispatchEvent(new CustomEvent('contrastToggle'));
      setInput(cleanedInput.replace('c', ''));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    parseInput(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('quickSubmit'));
    }
  };

  return (
    <div className="bg-white p-4 border rounded-md">
      <h4 className="font-semibold mb-2">Input by typing</h4>
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Example: -1 or 1- or 0r (with a for awesome)"
        className="w-full p-2 border rounded-md"
        autoComplete="off"
      />
      <p className="text-sm text-gray-600 mt-1">
        Format: [LSB: -/0/1] [Morph: -/0/1/2] (add "r" for redshift, "a" for awesome)
      </p>
    </div>
  );
};
