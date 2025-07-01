import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/Button';
import { QuickInput } from './QuickInput';

interface ClassificationFormProps {
  onSubmit: (data: any) => void;
  currentClassification?: any;
  galaxy: any;
}

export const ClassificationForm: React.FC<ClassificationFormProps> = ({
  onSubmit,
  currentClassification,
  galaxy
}) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      lsbClass: currentClassification?.lsbClass || '',
      morphology: currentClassification?.morphology || '',
      comments: currentClassification?.comments || '',
      awesomeFlag: currentClassification?.awesomeFlag || false,
      validRedshift: currentClassification?.validRedshift || false,
    }
  });

  const watchLsb = watch('lsbClass');
  const watchMorph = watch('morphology');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <QuickInput 
        onUpdate={(values) => {
          Object.entries(values).forEach(([key, value]) => {
            setValue(key as any, value);
          });
        }}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium">Comments:</label>
        <textarea
          {...register('comments')}
          rows={2}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('awesomeFlag')} />
          <span className="text-green-600">Awesome</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('validRedshift')} />
          <span className="text-red-600">Valid redshift</span>
        </label>
      </div>

      <div className="bg-white p-4 border rounded-md">
        <h4 className="font-semibold mb-3">Is it LSB?</h4>
        <div className="space-y-2">
          {[
            { value: -1, label: 'Failed fitting [-1]' },
            { value: 0, label: 'Non-LSB [0]' },
            { value: 1, label: 'LSB [1]' }
          ].map(option => (
            <label key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                value={option.value}
                {...register('lsbClass', { required: true })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errors.lsbClass && (
          <p className="text-red-500 text-sm mt-1">Please select an LSB classification</p>
        )}
      </div>

      <div className="bg-white p-4 border rounded-md">
        <h4 className="font-semibold mb-3">Morphology Type</h4>
        <div className="space-y-2">
          {[
            { value: -1, label: 'Featureless [-]' },
            { value: 0, label: 'Not sure (Irr/other) [0]' },
            { value: 1, label: 'LTG (Sp) [1]' },
            { value: 2, label: 'ETG (Ell) [2]' }
          ].map(option => (
            <label key={option.value} className="flex items-center space-x-2">
              <input
                type="radio"
                value={option.value}
                {...register('morphology', { 
                  required: watchLsb !== '-1' 
                })}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errors.morphology && (
          <p className="text-red-500 text-sm mt-1">Please select a morphology type</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Submit Classification
      </Button>
    </form>
  );
};
