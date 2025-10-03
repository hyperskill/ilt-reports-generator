# Radix UI Documentation Reference

**Official Site:** https://www.radix-ui.com  
**GitHub:** https://github.com/radix-ui

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Radix Primitives](#radix-primitives)
5. [Radix Themes](#radix-themes)
6. [Component Reference](#component-reference)
7. [Styling Guide](#styling-guide)
8. [Common Patterns](#common-patterns)
9. [Best Practices](#best-practices)

---

## Overview

Radix UI provides two main products:

### 1. Radix Primitives

**Unstyled, accessible UI components** for building high-quality design systems and web apps.

- ✅ **Unstyled**: Complete control over styling
- ✅ **Accessible**: WAI-ARIA compliant
- ✅ **Composable**: Granular control over component parts
- ✅ **Uncontrolled by default**: Can be controlled when needed
- ✅ **Tree-shakeable**: Only ship what you use

**Use when:**
- Building a custom design system from scratch
- Need complete styling control
- Want maximum flexibility

### 2. Radix Themes

**Pre-styled, production-ready component library** built on Radix Primitives.

- ✅ **Ready to use**: Beautiful defaults out of the box
- ✅ **Themeable**: Easy customization via Theme component
- ✅ **Consistent**: Unified design language
- ✅ **Accessible**: Built on Primitives foundation
- ✅ **Dark mode**: First-class dark mode support

**Use when:**
- Need to ship quickly
- Want beautiful, consistent UI without custom styling
- Prefer configuration over styling

---

## Installation

### Radix Primitives

Install all primitives at once (recommended):

```bash
npm install radix-ui
```

Or install individual components:

```bash
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tooltip
```

### Radix Themes

```bash
npm install @radix-ui/themes
```

---

## Getting Started

### Quick Start with Primitives

**1. Install:**
```bash
npm install radix-ui
```

**2. Import and use:**
```jsx
import { Dialog } from "radix-ui";

function MyDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Open Dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Description>
            This is a dialog description.
          </Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

**3. Add your styles** (CSS, CSS-in-JS, Tailwind, etc.):
```css
.DialogOverlay {
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;
}

.DialogContent {
  background: white;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 25px;
  max-width: 450px;
}
```

### Quick Start with Themes

**1. Install:**
```bash
npm install @radix-ui/themes
```

**2. Import CSS:**
```tsx
import "@radix-ui/themes/styles.css";
```

**3. Wrap app with Theme:**
```tsx
import { Theme } from "@radix-ui/themes";

export default function App() {
  return (
    <Theme>
      <MyApp />
    </Theme>
  );
}
```

**4. Start using components:**
```tsx
import { Flex, Text, Button, TextField } from "@radix-ui/themes";

export default function MyApp() {
  return (
    <Flex direction="column" gap="3">
      <Text size="5" weight="bold">Hello from Radix Themes</Text>
      <TextField.Root placeholder="Search..." />
      <Button>Get Started</Button>
    </Flex>
  );
}
```

---

## Radix Primitives

### Core Concepts

#### 1. Composition

Each component is broken into parts that can be composed together:

```jsx
import { Dialog } from "radix-ui";

<Dialog.Root>           {/* Manages state */}
  <Dialog.Trigger />    {/* Opens dialog */}
  <Dialog.Portal>       {/* Renders in portal */}
    <Dialog.Overlay />  {/* Background overlay */}
    <Dialog.Content>    {/* Dialog content */}
      <Dialog.Title />
      <Dialog.Description />
      <Dialog.Close />  {/* Close button */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

#### 2. Controlled vs Uncontrolled

**Uncontrolled (default):**
```jsx
<Dialog.Root defaultOpen={false}>
  {/* Component manages its own state */}
</Dialog.Root>
```

**Controlled:**
```jsx
const [open, setOpen] = useState(false);

<Dialog.Root open={open} onOpenChange={setOpen}>
  {/* You control the state */}
</Dialog.Root>
```

#### 3. asChild Prop

Use `asChild` to merge component behavior with your own element:

```jsx
// Without asChild - renders a button
<Dialog.Trigger>Open</Dialog.Trigger>

// With asChild - merges with your component
<Dialog.Trigger asChild>
  <MyCustomButton>Open</MyCustomButton>
</Dialog.Trigger>
```

#### 4. Data Attributes

Components expose state via data attributes for styling:

```jsx
<Accordion.Item value="item-1" />
// When open: <div data-state="open" />
// When closed: <div data-state="closed" />
```

### Common Primitives

#### Dialog

Modal window overlay.

```jsx
import { Dialog } from "radix-ui";

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Features:**
- Focus trap when open
- Esc to close
- Click outside to close (configurable)
- Modal and non-modal modes
- Screen reader announcements

#### Dropdown Menu

Context menu triggered by a button.

```jsx
import { DropdownMenu } from "radix-ui";

<DropdownMenu.Root>
  <DropdownMenu.Trigger>Options</DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content>
      <DropdownMenu.Item>Edit</DropdownMenu.Item>
      <DropdownMenu.Item>Delete</DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item>Archive</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

#### Popover

Non-modal overlay anchored to an element.

```jsx
import { Popover } from "radix-ui";

<Popover.Root>
  <Popover.Trigger>Show info</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content>
      <Popover.Arrow />
      Content here
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
```

#### Select

Native select replacement with rich functionality.

```jsx
import { Select } from "radix-ui";

<Select.Root defaultValue="apple">
  <Select.Trigger>
    <Select.Value />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.Item value="apple">Apple</Select.Item>
      <Select.Item value="banana">Banana</Select.Item>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

#### Tabs

Organize content into tabs.

```jsx
import { Tabs } from "radix-ui";

<Tabs.Root defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Account</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Password</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Account settings</Tabs.Content>
  <Tabs.Content value="tab2">Password settings</Tabs.Content>
</Tabs.Root>
```

#### Accordion

Collapsible content sections.

```jsx
import { Accordion } from "radix-ui";

<Accordion.Root type="single" collapsible>
  <Accordion.Item value="item-1">
    <Accordion.Trigger>Section 1</Accordion.Trigger>
    <Accordion.Content>Content 1</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Trigger>Section 2</Accordion.Trigger>
    <Accordion.Content>Content 2</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

**Types:**
- `single`: Only one item open at a time
- `multiple`: Multiple items can be open

#### Toast

Notification messages.

```jsx
import { Toast } from "radix-ui";

function ToastDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Toast.Provider>
      <button onClick={() => setOpen(true)}>Show toast</button>

      <Toast.Root open={open} onOpenChange={setOpen}>
        <Toast.Title>Notification</Toast.Title>
        <Toast.Description>Your changes have been saved</Toast.Description>
        <Toast.Close>Dismiss</Toast.Close>
      </Toast.Root>

      <Toast.Viewport />
    </Toast.Provider>
  );
}
```

#### Tooltip

Contextual information on hover.

```jsx
import { Tooltip } from "radix-ui";

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content>
        Tooltip content
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

### Form Controls

#### Checkbox

```jsx
import { Checkbox } from "radix-ui";

<Checkbox.Root id="terms">
  <Checkbox.Indicator>
    <CheckIcon />
  </Checkbox.Indicator>
</Checkbox.Root>
<label htmlFor="terms">Accept terms</label>
```

#### Radio Group

```jsx
import { RadioGroup } from "radix-ui";

<RadioGroup.Root defaultValue="option1">
  <RadioGroup.Item value="option1" id="r1">
    <RadioGroup.Indicator />
  </RadioGroup.Item>
  <label htmlFor="r1">Option 1</label>

  <RadioGroup.Item value="option2" id="r2">
    <RadioGroup.Indicator />
  </RadioGroup.Item>
  <label htmlFor="r2">Option 2</label>
</RadioGroup.Root>
```

#### Switch

```jsx
import { Switch } from "radix-ui";

<Switch.Root id="airplane-mode">
  <Switch.Thumb />
</Switch.Root>
<label htmlFor="airplane-mode">Airplane Mode</label>
```

#### Slider

```jsx
import { Slider } from "radix-ui";

<Slider.Root defaultValue={[50]} max={100} step={1}>
  <Slider.Track>
    <Slider.Range />
  </Slider.Track>
  <Slider.Thumb />
</Slider.Root>
```

---

## Radix Themes

### Theme Configuration

Configure your theme at the root:

```tsx
import { Theme } from "@radix-ui/themes";

<Theme
  accentColor="blue"      // Brand color
  grayColor="slate"       // Neutral color
  radius="medium"         // Border radius
  scaling="100%"          // Size scale
  appearance="light"      // or "dark"
>
  <App />
</Theme>
```

### Theme Options

#### Accent Colors

Available colors: `gray`, `gold`, `bronze`, `brown`, `yellow`, `amber`, `orange`, `tomato`, `red`, `ruby`, `crimson`, `pink`, `plum`, `purple`, `violet`, `iris`, `indigo`, `blue`, `cyan`, `teal`, `jade`, `green`, `grass`, `lime`, `mint`, `sky`

#### Gray Colors

Available: `gray`, `mauve`, `slate`, `sage`, `olive`, `sand`

#### Radius

- `none`: 0px
- `small`: 2px
- `medium`: 4px (default)
- `large`: 6px
- `full`: 9999px

#### Scaling

- `90%`: Compact
- `95%`: Comfortable
- `100%`: Default
- `105%`: Spacious
- `110%`: Large

### Dark Mode

```tsx
import { Theme } from "@radix-ui/themes";

// Manual
<Theme appearance="dark">
  <App />
</Theme>

// Responsive to system preference
<Theme appearance="inherit">
  <App />
</Theme>
```

Or toggle programmatically:

```tsx
const [appearance, setAppearance] = useState('light');

<Theme appearance={appearance}>
  <button onClick={() => setAppearance(appearance === 'light' ? 'dark' : 'light')}>
    Toggle theme
  </button>
  <App />
</Theme>
```

### Layout Components

#### Box

Generic container.

```tsx
<Box p="4" bg="blue">
  Content
</Box>
```

#### Flex

Flexbox layout.

```tsx
<Flex direction="column" gap="3" align="center" justify="between">
  <div>Item 1</div>
  <div>Item 2</div>
</Flex>
```

**Props:**
- `direction`: `row`, `column`, `row-reverse`, `column-reverse`
- `align`: `start`, `center`, `end`, `baseline`, `stretch`
- `justify`: `start`, `center`, `end`, `between`, `around`
- `gap`: `1` to `9`
- `wrap`: `nowrap`, `wrap`, `wrap-reverse`

#### Grid

CSS Grid layout.

```tsx
<Grid columns="3" gap="3">
  <Box>Cell 1</Box>
  <Box>Cell 2</Box>
  <Box>Cell 3</Box>
</Grid>
```

#### Container

Centered container with max-width.

```tsx
<Container size="3">
  <Text>Centered content</Text>
</Container>
```

**Sizes:** `1` (448px), `2` (688px), `3` (880px), `4` (1136px)

#### Section

Vertical spacing for sections.

```tsx
<Section size="2">
  <Heading>Section Title</Heading>
  <Text>Section content</Text>
</Section>
```

### Typography

#### Text

```tsx
<Text size="5" weight="bold" color="red">
  Important text
</Text>
```

**Props:**
- `size`: `1` to `9`
- `weight`: `light`, `regular`, `medium`, `bold`
- `color`: Any theme color
- `align`: `left`, `center`, `right`

#### Heading

```tsx
<Heading size="8" weight="bold">
  Page Title
</Heading>
```

**Sizes:** `1` to `9` (maps to h1-h6)

#### Code

```tsx
<Code>const x = 5;</Code>
```

#### Quote

```tsx
<Quote>
  This is a quote
</Quote>
```

### Form Components

#### Button

```tsx
<Button size="3" variant="solid" color="blue">
  Click me
</Button>
```

**Variants:** `classic`, `solid`, `soft`, `surface`, `outline`, `ghost`

**With icon:**
```tsx
<Button>
  <PlusIcon />
  Add item
</Button>
```

#### TextField

```tsx
<TextField.Root placeholder="Enter text..." />

// With icon
<TextField.Root>
  <TextField.Slot>
    <MagnifyingGlassIcon />
  </TextField.Slot>
</TextField.Root>
```

#### TextArea

```tsx
<TextArea placeholder="Type your message..." />
```

#### Select

```tsx
<Select.Root defaultValue="apple">
  <Select.Trigger />
  <Select.Content>
    <Select.Item value="apple">Apple</Select.Item>
    <Select.Item value="orange">Orange</Select.Item>
  </Select.Content>
</Select.Root>
```

#### Checkbox

```tsx
<Checkbox defaultChecked />
<Text>Accept terms</Text>
```

#### Radio Group

```tsx
<RadioGroup.Root defaultValue="1">
  <RadioGroup.Item value="1">Option 1</RadioGroup.Item>
  <RadioGroup.Item value="2">Option 2</RadioGroup.Item>
</RadioGroup.Root>
```

#### Switch

```tsx
<Switch defaultChecked />
<Text>Enable notifications</Text>
```

#### Slider

```tsx
<Slider defaultValue={[50]} />
```

### Data Display

#### Table

```tsx
<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
      <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>John Doe</Table.Cell>
      <Table.Cell>john@example.com</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>
```

#### Card

```tsx
<Card>
  <Heading size="3">Card Title</Heading>
  <Text>Card content</Text>
</Card>
```

#### Badge

```tsx
<Badge color="green">Active</Badge>
<Badge color="red">Inactive</Badge>
```

#### Avatar

```tsx
<Avatar
  src="https://images.unsplash.com/photo-1..."
  fallback="JD"
/>
```

#### Callout

```tsx
<Callout.Root color="blue">
  <Callout.Icon>
    <InfoIcon />
  </Callout.Icon>
  <Callout.Text>
    Important information
  </Callout.Text>
</Callout.Root>
```

### Overlays

#### Dialog

```tsx
<Dialog.Root>
  <Dialog.Trigger>
    <Button>Open Dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Dialog Title</Dialog.Title>
    <Dialog.Description>
      Dialog description
    </Dialog.Description>
    <Flex gap="3" justify="end">
      <Dialog.Close>
        <Button variant="soft">Cancel</Button>
      </Dialog.Close>
      <Button>Save</Button>
    </Flex>
  </Dialog.Content>
</Dialog.Root>
```

#### AlertDialog

Confirmation dialog.

```tsx
<AlertDialog.Root>
  <AlertDialog.Trigger>
    <Button color="red">Delete</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Title>Confirm deletion</AlertDialog.Title>
    <AlertDialog.Description>
      This action cannot be undone.
    </AlertDialog.Description>
    <Flex gap="3" justify="end">
      <AlertDialog.Cancel>
        <Button variant="soft">Cancel</Button>
      </AlertDialog.Cancel>
      <AlertDialog.Action>
        <Button color="red">Delete</Button>
      </AlertDialog.Action>
    </Flex>
  </AlertDialog.Content>
</AlertDialog.Root>
```

#### Popover

```tsx
<Popover.Root>
  <Popover.Trigger>
    <Button>Open</Button>
  </Popover.Trigger>
  <Popover.Content>
    Popover content
  </Popover.Content>
</Popover.Root>
```

---

## Styling Guide

### Styling Primitives

Radix Primitives are **unstyled** by default. You have complete control.

#### Method 1: CSS Classes

```jsx
<Dialog.Content className="dialog-content">
  Content
</Dialog.Content>
```

```css
.dialog-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
}

/* Style based on state */
.dialog-content[data-state="open"] {
  animation: fadeIn 200ms;
}
```

#### Method 2: CSS-in-JS

```jsx
import styled from 'styled-components';
import { Dialog } from 'radix-ui';

const StyledContent = styled(Dialog.Content)`
  background: white;
  border-radius: 8px;
  padding: 24px;

  &[data-state="open"] {
    animation: fadeIn 200ms;
  }
`;

<StyledContent>Content</StyledContent>
```

#### Method 3: Tailwind CSS

```jsx
<Dialog.Content className="bg-white rounded-lg p-6 shadow-xl">
  Content
</Dialog.Content>
```

#### Data Attributes for State

Components expose their state via data attributes:

- `data-state`: `open`, `closed`, `on`, `off`, `active`, `inactive`
- `data-disabled`: Present when disabled
- `data-highlighted`: Present when highlighted (menus)
- `data-orientation`: `horizontal`, `vertical`

```css
/* Closed state */
[data-state="closed"] {
  opacity: 0;
}

/* Open state */
[data-state="open"] {
  opacity: 1;
  animation: fadeIn 200ms;
}

/* Disabled state */
[data-disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Styling Themes

Radix Themes components can be customized in multiple ways:

#### 1. Theme Tokens (Recommended)

```tsx
<Theme
  accentColor="blue"
  grayColor="slate"
  radius="large"
>
  <Button>Styled by theme</Button>
</Theme>
```

#### 2. Component Props

Most components accept styling props:

```tsx
<Button size="3" variant="soft" color="crimson" highContrast>
  Custom button
</Button>

<Text size="5" weight="bold" color="blue">
  Custom text
</Text>

<Box p="4" m="2" bg="gray" style={{ borderRadius: 8 }}>
  Custom box
</Box>
```

#### 3. CSS Variables

Override theme CSS variables:

```css
:root {
  --accent-9: blue;
  --radius-1: 4px;
}
```

#### 4. Custom Classes

Add custom CSS:

```tsx
<Button className="my-custom-button">
  Button
</Button>
```

```css
.my-custom-button {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Common Patterns

### Form Validation

```tsx
import { TextField, Text } from "@radix-ui/themes";
import { useState } from "react";

function ValidatedInput() {
  const [error, setError] = useState("");

  const validate = (value) => {
    if (!value) {
      setError("Required field");
    } else if (value.length < 3) {
      setError("Minimum 3 characters");
    } else {
      setError("");
    }
  };

  return (
    <div>
      <TextField.Root
        placeholder="Enter name..."
        onChange={(e) => validate(e.target.value)}
        color={error ? "red" : undefined}
      />
      {error && <Text size="2" color="red">{error}</Text>}
    </div>
  );
}
```

### Confirmation Dialog

```tsx
function DeleteButton({ onConfirm }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button color="red">Delete</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Confirm Deletion</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure? This action cannot be undone.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Cancel</Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" onClick={onConfirm}>Delete</Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
```

### Dropdown Menu with Actions

```tsx
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button variant="soft">
      Options
      <ChevronDownIcon />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item onSelect={() => handleEdit()}>
      <Pencil1Icon />
      Edit
    </DropdownMenu.Item>
    <DropdownMenu.Item onSelect={() => handleDuplicate()}>
      <CopyIcon />
      Duplicate
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item color="red" onSelect={() => handleDelete()}>
      <TrashIcon />
      Delete
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### Tabs with Routes (Next.js/React Router)

```tsx
import { Tabs } from "@radix-ui/themes";
import { useRouter } from "next/router";

function TabNavigation() {
  const router = useRouter();
  const currentTab = router.pathname.split('/')[1] || 'home';

  return (
    <Tabs.Root value={currentTab} onValueChange={(v) => router.push(`/${v}`)}>
      <Tabs.List>
        <Tabs.Trigger value="home">Home</Tabs.Trigger>
        <Tabs.Trigger value="about">About</Tabs.Trigger>
        <Tabs.Trigger value="contact">Contact</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  );
}
```

### Toast Notifications

```tsx
import { Toast } from "radix-ui";
import { useState } from "react";

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <Toast.Provider>
      {children}
      {toasts.map(toast => (
        <Toast.Root key={toast.id} open onOpenChange={() => {}}>
          <Toast.Title>{toast.message}</Toast.Title>
        </Toast.Root>
      ))}
      <Toast.Viewport />
    </Toast.Provider>
  );
}
```

---

## Best Practices

### 1. Accessibility

✅ **Always use semantic HTML**
```tsx
// Good
<Dialog.Title>Title</Dialog.Title>

// Bad - missing title
<Dialog.Content>Content without title</Dialog.Content>
```

✅ **Provide labels for form controls**
```tsx
<label htmlFor="email">Email</label>
<input id="email" />
```

✅ **Use proper ARIA attributes** (Radix handles most automatically)

### 2. Component Composition

✅ **Prefer composition over configuration**
```tsx
// Good - explicit structure
<Select.Root>
  <Select.Trigger />
  <Select.Content>
    <Select.Item value="1">One</Select.Item>
  </Select.Content>
</Select.Root>

// Avoid - overly abstracted
<Select options={[...]} />
```

### 3. State Management

✅ **Start uncontrolled, add control when needed**
```tsx
// Simple use case - uncontrolled
<Dialog.Root defaultOpen={false}>

// Complex use case - controlled
const [open, setOpen] = useState(false);
<Dialog.Root open={open} onOpenChange={setOpen}>
```

### 4. Performance

✅ **Use Portal for overlays** (prevents layout issues)
```tsx
<Dialog.Portal>
  <Dialog.Content>...</Dialog.Content>
</Dialog.Portal>
```

✅ **Lazy load heavy components**
```tsx
const Dialog = lazy(() => import('./Dialog'));
```

### 5. Styling

✅ **Use CSS variables for theming**
```css
:root {
  --primary-color: blue;
  --border-radius: 8px;
}

.button {
  background: var(--primary-color);
  border-radius: var(--border-radius);
}
```

✅ **Target data attributes for states**
```css
[data-state="checked"] {
  background: green;
}
```

### 6. TypeScript

✅ **Use proper types**
```tsx
import type { DialogProps } from "radix-ui";

const MyDialog: React.FC<DialogProps> = (props) => {
  // Component implementation
};
```

---

## Migration Guide

### From Headless UI to Radix

| Headless UI | Radix Primitives |
|-------------|------------------|
| `Dialog` | `Dialog.Root` + `Dialog.Content` |
| `Menu` | `DropdownMenu.Root` + parts |
| `Popover` | `Popover.Root` + parts |
| `Switch` | `Switch.Root` + `Switch.Thumb` |
| `Tab.Group` | `Tabs.Root` |

### From Material-UI to Radix Themes

| Material-UI | Radix Themes |
|-------------|--------------|
| `Button` | `Button` |
| `TextField` | `TextField.Root` |
| `Select` | `Select.Root` + parts |
| `Dialog` | `Dialog.Root` + parts |
| `Card` | `Card` |
| `Grid` | `Grid` |

---

## Resources

- **Official Documentation:** https://www.radix-ui.com
- **GitHub:** https://github.com/radix-ui/primitives
- **Discord:** https://discord.com/invite/7Xb99uG
- **Twitter:** @radix_ui / Bluesky: @radix-ui.com

### Component Libraries Built on Radix

- **shadcn/ui:** Beautiful components with Tailwind CSS
- **Radix Themes:** Official styled components
- **Ark UI:** Alternative styling
- **Many more:** Check awesome-radix-ui on GitHub

---

**Last Updated:** 2025-10-02  
**Version:** Primitives 1.x, Themes 3.x

