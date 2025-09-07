import type { Meta, StoryObj } from '@storybook/svelte';
import Button from './Button.svelte';

const meta = {
	title: 'Atoms/Button',
	component: Button,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: { type: 'select' },
			options: ['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link']
		},
		size: {
			control: { type: 'select' },
			options: ['sm', 'default', 'lg', 'icon']
		},
		disabled: {
			control: 'boolean'
		},
		loading: {
			control: 'boolean'
		}
	},
} satisfies Meta<Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: {
		children: 'Button',
		variant: 'primary'
	},
};

export const Secondary: Story = {
	args: {
		children: 'Button',
		variant: 'secondary'
	},
};

export const Destructive: Story = {
	args: {
		children: 'Delete',
		variant: 'destructive'
	},
};

export const Outline: Story = {
	args: {
		children: 'Button',
		variant: 'outline'
	},
};

export const Ghost: Story = {
	args: {
		children: 'Button',
		variant: 'ghost'
	},
};

export const Link: Story = {
	args: {
		children: 'Button',
		variant: 'link'
	},
};

export const Loading: Story = {
	args: {
		children: 'Please wait',
		loading: true
	},
};

export const Disabled: Story = {
	args: {
		children: 'Button',
		disabled: true
	},
};

export const Small: Story = {
	args: {
		children: 'Button',
		size: 'sm'
	},
};

export const Large: Story = {
	args: {
		children: 'Button',
		size: 'lg'
	},
};

export const Icon: Story = {
	args: {
		size: 'icon',
		children: '🚀'
	},
};