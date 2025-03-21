import React from 'react';
import { Button, FormField, Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';
import { useForm } from '@/lib/validation';
import { createValidationRules, patterns } from '@/lib/form-validation';
import { toast } from 'react-hot-toast';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const validationSchema = {
  name: {
    required: true,
    minLength: 2,
    pattern: patterns.name,
    message: 'Name can only contain letters and spaces',
  },
  email: {
    required: true,
    pattern: patterns.email,
    message: 'Please enter a valid email address',
  },
  subject: {
    required: true,
    minLength: 5,
    maxLength: 100,
    message: 'Subject must be between 5 and 100 characters',
  },
  message: {
    required: true,
    minLength: 20,
    maxLength: 1000,
    message: 'Message must be between 20 and 1000 characters',
  },
};

export function FormExample() {
  const {
    values,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  } = useForm<ContactForm>(
    {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
    createValidationRules(validationSchema)
  );

  const onSubmit = handleSubmit(async (formValues) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form submitted:', formValues);
      toast.success('Message sent successfully!');
      reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Contact Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="name"
              name="name"
              label="Full Name"
              type="text"
              required
              value={values.name}
              error={errors.name}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="name"
              description="Please enter your full name"
            />

            <FormField
              id="email"
              name="email"
              label="Email Address"
              type="email"
              required
              value={values.email}
              error={errors.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              description="We'll never share your email"
            />
          </div>

          <FormField
            id="subject"
            name="subject"
            label="Subject"
            type="text"
            required
            value={values.subject}
            error={errors.subject}
            onChange={handleChange}
            onBlur={handleBlur}
            description="Brief subject of your message"
          />

          <FormField
            id="message"
            name="message"
            label="Message"
            multiline
            required
            rows={5}
            value={values.message}
            error={errors.message}
            onChange={handleChange}
            onBlur={handleBlur}
            description="Your message (minimum 20 characters)"
          />

          <CardFooter className="px-0 pb-0">
            <div className="flex items-center justify-end gap-4 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={!isDirty || isSubmitting}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting}
                loading={isSubmitting}
              >
                Send Message
              </Button>
            </div>
          </CardFooter>
        </form>
      </CardContent>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 border-t border-gray-100">
          <details className="text-sm">
            <summary className="font-medium cursor-pointer text-gray-500">
              Debug Info
            </summary>
            <pre className="mt-2 whitespace-pre-wrap bg-gray-50 p-4 rounded text-xs">
              {JSON.stringify({ values, errors, isSubmitting, isDirty }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </Card>
  );
}
