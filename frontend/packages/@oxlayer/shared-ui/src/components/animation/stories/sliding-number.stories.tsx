import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SlidingNumber } from "../sliding-number";

const meta: Meta<typeof SlidingNumber> = {
  title: "Animation/SlidingNumber",
  component: SlidingNumber,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    number: {
      control: { type: "number" },
    },
    decimalPlaces: {
      control: { type: "number", min: 0, max: 4 },
    },
    padStart: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    number: 1234,
    className: "text-3xl font-mono",
  },
};

export const WithDecimals: Story = {
  args: {
    number: 99.99,
    decimalPlaces: 2,
    className: "text-3xl font-mono",
  },
};

export const WithThousandSeparator: Story = {
  args: {
    number: 1234567,
    thousandSeparator: ",",
    className: "text-3xl font-mono",
  },
};

export const FromZero: Story = {
  args: {
    number: 500,
    fromNumber: 0,
    className: "text-4xl font-mono text-lime-400",
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(0);
    return (
      <div className="flex flex-col items-center gap-4">
        <SlidingNumber number={value} fromNumber={0} className="text-5xl font-mono text-lime-400" />
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-stone-800 rounded hover:bg-stone-700"
            onClick={() => setValue(v => v + 100)}
          >
            +100
          </button>
          <button
            className="px-4 py-2 bg-stone-800 rounded hover:bg-stone-700"
            onClick={() => setValue(v => Math.max(0, v - 100))}
          >
            -100
          </button>
          <button
            className="px-4 py-2 bg-stone-800 rounded hover:bg-stone-700"
            onClick={() => setValue(Math.floor(Math.random() * 10000))}
          >
            Random
          </button>
        </div>
      </div>
    );
  },
};

export const CountUp: Story = {
  args: {
    number: 9876,
    fromNumber: 0,
    padStart: true,
    className: "text-6xl font-mono tracking-tight",
  },
};

export const InContext: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-2xl">
      <span className="text-muted-foreground">Total users:</span>
      <SlidingNumber
        number={42567}
        fromNumber={0}
        thousandSeparator=","
        className="font-mono font-bold text-foreground"
      />
    </div>
  ),
};
