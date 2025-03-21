# UI Components

This directory contains reusable UI components built with React, TypeScript, and Tailwind CSS.

## Installation

All components are available through the barrel file:

```typescript
import { Button, Input, Card, FormField } from '@/components/ui';
```

## Available Components

### Button

A versatile button component with multiple variants and states.

```tsx
import { Button } from '@/components/ui';

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// Loading state
<Button loading>Loading...</Button>

// Full width
<Button fullWidth>Full Width</Button>
```

### FormField

A compound component that combines Label, Input/Textarea, and error handling.

```tsx
import { FormField } from '@/components/ui';

// Basic input field
<FormField
  id="email"
  label="Email Address"
  type="email"
  required
/>

// With error handling
<FormField
  id="password"
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// Textarea
<FormField
  id="message"
  label="Message"
  multiline
  rows={4}
/>

// With description
<FormField
  id="username"
  label="Username"
  description="This will be your public display name"
  optional
/>
```

### Card

A flexible card component with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional card description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>

// Variants
<Card variant="elevated">Elevated Card</Card>
<Card variant="outline">Outline Card</Card>

// With hover effect
<Card hover>Hoverable Card</Card>

// Without padding
<Card padded={false}>Custom Padding Card</Card>
```

### Input & Textarea

Form input components with consistent styling and validation states.

```tsx
import { Input, Textarea } from '@/components/ui';

// Basic input
<Input placeholder="Enter text" />

// With validation
<Input 
  error="This field is required"
  placeholder="Required field"
/>

<Input 
  success="Username is available"
  placeholder="Choose username"
/>

// Textarea
<Textarea 
  placeholder="Enter long text"
  rows={4}
/>

// Sizes
<Input size="sm" placeholder="Small input" />
<Input size="default" placeholder="Default input" />
<Input size="lg" placeholder="Large input" />
```

### Label

A form label component with support for required/optional indicators.

```tsx
import { Label } from '@/components/ui';

<Label htmlFor="email">Email Address</Label>

// Required field
<Label htmlFor="name" required>Full Name</Label>

// Optional field
<Label htmlFor="bio" optional>Biography</Label>

// With error state
<Label htmlFor="password" error>Password</Label>
```

## Customization

Components can be customized using Tailwind classes through the `className` prop:

```tsx
<Button className="bg-purple-600 hover:bg-purple-700">
  Custom Button
</Button>
```

You can also use the variant functions directly for custom components:

```tsx
import { buttonVariants } from '@/components/ui';

const customClass = buttonVariants({ variant: 'outline', size: 'lg' });
```

## TypeScript Support

All components come with full TypeScript support and exported type definitions:

```typescript
import type { ButtonProps, CardProps, InputProps } from '@/components/ui';
```

## Best Practices

1. Always provide a descriptive `id` for form fields
2. Use the `required` or `optional` props on Labels for clarity
3. Handle loading states appropriately with the `loading` prop
4. Use semantic HTML within Card components
5. Provide meaningful error messages for form validation
