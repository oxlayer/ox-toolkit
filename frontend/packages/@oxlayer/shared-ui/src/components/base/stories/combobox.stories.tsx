import type { Meta, StoryObj } from "@storybook/react";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopup,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxSeparator,
} from "../combobox";

const meta: Meta<typeof Combobox> = {
  title: "UI/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

type FrameworkItem = { label: string; value: string };

const frameworks: FrameworkItem[] = [
  { label: "React", value: "react" },
  { label: "Vue", value: "vue" },
  { label: "Angular", value: "angular" },
  { label: "Svelte", value: "svelte" },
  { label: "Solid", value: "solid" },
];

/**
 * Default combobox with search functionality
 */
export const Default: Story = {
  args: {},
  render: function ComboboxDemo() {
    return (
      <div className="w-64">
        <Combobox<FrameworkItem, false>>
          <ComboboxInput placeholder="Search frameworks..." />
          <ComboboxPopup>
            <ComboboxList>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              {frameworks.map(item => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </div>
    );
  },
};

/**
 * Combobox input sizes
 */
export const Sizes: Story = {
  args: {},
  render: function ComboboxSizesDemo() {
    return (
      <div className="flex flex-col gap-4 w-64">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Small</p>
          <Combobox<FrameworkItem, false>>
            <ComboboxInput size="sm" placeholder="Small combobox" />
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxEmpty>No results.</ComboboxEmpty>
                {frameworks.map(item => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Default</p>
          <Combobox<FrameworkItem, false>>
            <ComboboxInput size="default" placeholder="Default combobox" />
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxEmpty>No results.</ComboboxEmpty>
                {frameworks.map(item => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Large</p>
          <Combobox<FrameworkItem, false>>
            <ComboboxInput size="lg" placeholder="Large combobox" />
            <ComboboxPopup>
              <ComboboxList>
                <ComboboxEmpty>No results.</ComboboxEmpty>
                {frameworks.map(item => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
        </div>
      </div>
    );
  },
};

/**
 * Combobox with grouped options
 */
export const WithGroups: Story = {
  args: {},
  render: function ComboboxGroupsDemo() {
    const frontendFrameworks: FrameworkItem[] = [
      { label: "React", value: "react" },
      { label: "Vue", value: "vue" },
      { label: "Angular", value: "angular" },
    ];

    const backendFrameworks: FrameworkItem[] = [
      { label: "Express", value: "express" },
      { label: "Fastify", value: "fastify" },
      { label: "Hono", value: "hono" },
    ];

    return (
      <div className="w-64">
        <Combobox<FrameworkItem, false>>
          <ComboboxInput placeholder="Search frameworks..." />
          <ComboboxPopup>
            <ComboboxList>
              <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
              <ComboboxGroup>
                <ComboboxGroupLabel>Frontend</ComboboxGroupLabel>
                {frontendFrameworks.map(item => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
              <ComboboxSeparator />
              <ComboboxGroup>
                <ComboboxGroupLabel>Backend</ComboboxGroupLabel>
                {backendFrameworks.map(item => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </div>
    );
  },
};
