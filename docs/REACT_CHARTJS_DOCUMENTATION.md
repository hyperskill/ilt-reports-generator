# React Chart.js 2 Documentation Reference

**Official Site:** https://react-chartjs-2.js.org  
**GitHub:** https://github.com/reactchartjs/react-chartjs-2  
**npm:** https://www.npmjs.com/package/react-chartjs-2

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Component Reference](#component-reference)
5. [Working with Data](#working-with-data)
6. [Working with Events](#working-with-events)
7. [Using Refs](#using-refs)
8. [TypeScript Support](#typescript-support)
9. [Common Patterns](#common-patterns)
10. [Best Practices](#best-practices)

---

## Overview

**react-chartjs-2** is a React wrapper for [Chart.js](https://www.chartjs.org), providing React components for all Chart.js chart types.

### Key Features

- ✅ **React Components**: Use Chart.js with familiar React patterns
- ✅ **TypeScript Support**: Fully typed API
- ✅ **Tree-shakeable**: Import only what you need
- ✅ **Hook-friendly**: Works great with React Hooks
- ✅ **Flexible**: Access to full Chart.js API
- ✅ **Up-to-date**: Supports Chart.js v4

### Version Compatibility

| react-chartjs-2 | Chart.js | Notes |
|----------------|----------|-------|
| v5.x | v4.x | Latest (ESM + CommonJS) |
| v4.x | v3.x | Legacy |
| v3.x | v2.x | Legacy |

---

## Installation

Install both `chart.js` and `react-chartjs-2`:

```bash
# npm
npm install chart.js react-chartjs-2

# yarn
yarn add chart.js react-chartjs-2

# pnpm
pnpm add chart.js react-chartjs-2
```

### Requirements

- React 16.8+ (hooks support)
- Chart.js 4.x
- Modern bundler (Webpack, Vite, etc.)

---

## Quick Start

### Basic Example

```jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function App() {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Chart.js Bar Chart',
      },
    },
  };

  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Dataset 2',
        data: [28, 48, 40, 19, 86, 27, 90],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return <Bar options={options} data={data} />;
}
```

### Tree-Shaking (Important!)

You **must** register Chart.js components you want to use. This enables tree-shaking to reduce bundle size.

```jsx
import {
  Chart as ChartJS,
  CategoryScale,    // For categorical axis
  LinearScale,      // For linear axis
  BarElement,       // For bar charts
  Title,            // For title plugin
  Tooltip,          // For tooltip plugin
  Legend,           // For legend plugin
} from 'chart.js';

// Register everything you'll use
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
```

Common registrations by chart type:

```jsx
// Line Chart
import { CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Bar Chart
import { CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Pie/Doughnut Chart
import { ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

// Radar Chart
import { RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
```

---

## Component Reference

All chart components accept the same base props and render a Chart.js chart.

### Available Components

- `<Bar />` - Bar chart
- `<Line />` - Line chart
- `<Pie />` - Pie chart
- `<Doughnut />` - Doughnut chart
- `<Bubble />` - Bubble chart
- `<Scatter />` - Scatter chart
- `<PolarArea />` - Polar area chart
- `<Radar />` - Radar chart
- `<Chart />` - Generic chart (specify type)

### Common Props

All components support these props:

| Prop | Type | Description |
|------|------|-------------|
| `data` | `ChartData` | **Required**. Chart data |
| `options` | `ChartOptions` | Chart configuration |
| `plugins` | `Plugin[]` | Chart.js plugins array |
| `datasetIdKey` | `string` | Key to identify datasets (default: `'label'`) |
| `updateMode` | `UpdateMode` | Update animation mode: `'resize'`, `'reset'`, `'none'`, `'hide'`, `'show'`, `'normal'`, `'active'` |
| `redraw` | `boolean` | Force chart recreation on update |
| `...canvasProps` | - | Any standard `<canvas>` props |

### Bar Chart

```jsx
import { Bar } from 'react-chartjs-2';

<Bar
  data={data}
  options={options}
  height={400}
  width={600}
/>
```

### Line Chart

```jsx
import { Line } from 'react-chartjs-2';

<Line
  data={data}
  options={options}
/>
```

### Pie Chart

```jsx
import { Pie } from 'react-chartjs-2';

<Pie
  data={data}
  options={options}
/>
```

### Doughnut Chart

```jsx
import { Doughnut } from 'react-chartjs-2';

<Doughnut
  data={data}
  options={options}
/>
```

### Scatter Chart

```jsx
import { Scatter } from 'react-chartjs-2';

<Scatter
  data={data}
  options={options}
/>
```

### Bubble Chart

```jsx
import { Bubble } from 'react-chartjs-2';

<Bubble
  data={data}
  options={options}
/>
```

### Radar Chart

```jsx
import { Radar } from 'react-chartjs-2';

<Radar
  data={data}
  options={options}
/>
```

### PolarArea Chart

```jsx
import { PolarArea } from 'react-chartjs-2';

<PolarArea
  data={data}
  options={options}
/>
```

### Generic Chart Component

Use `<Chart />` when you need dynamic chart types:

```jsx
import { Chart } from 'react-chartjs-2';

<Chart
  type='bar'  // or 'line', 'pie', etc.
  data={data}
  options={options}
/>
```

---

## Working with Data

### Data Structure

Chart data follows Chart.js format:

```jsx
const data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Dataset 1',
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    },
  ],
};
```

### Dataset Identification

**Important:** To prevent datasets from merging during re-renders, each dataset needs a unique identifier.

By default, the library uses `label` property. If your datasets don't have labels or labels are not unique, specify a different key:

```jsx
<Line
  datasetIdKey='id'
  data={{
    labels: ['Jun', 'Jul', 'Aug'],
    datasets: [
      {
        id: 1,        // Use 'id' as unique key
        label: '',
        data: [5, 6, 7],
      },
      {
        id: 2,        // Different id
        label: '',
        data: [3, 2, 1],
      },
    ],
  }}
/>
```

### Dynamic Data Updates

Update data by changing the `data` prop:

```jsx
import { useState } from 'react';
import { Line } from 'react-chartjs-2';

function DynamicChart() {
  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Sales',
      data: [65, 59, 80],
    }],
  });

  const updateData = () => {
    setChartData({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{
        label: 'Sales',
        data: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
      }],
    });
  };

  return (
    <div>
      <Line data={chartData} />
      <button onClick={updateData}>Update Data</button>
    </div>
  );
}
```

### Adding/Removing Data Points

```jsx
const addData = () => {
  setChartData(prevData => ({
    labels: [...prevData.labels, 'New Label'],
    datasets: prevData.datasets.map(dataset => ({
      ...dataset,
      data: [...dataset.data, Math.random() * 100]
    }))
  }));
};

const removeData = () => {
  setChartData(prevData => ({
    labels: prevData.labels.slice(0, -1),
    datasets: prevData.datasets.map(dataset => ({
      ...dataset,
      data: dataset.data.slice(0, -1)
    }))
  }));
};
```

### Multiple Datasets

```jsx
const data = {
  labels: ['January', 'February', 'March'],
  datasets: [
    {
      label: 'Sales',
      data: [65, 59, 80],
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
    {
      label: 'Revenue',
      data: [28, 48, 40],
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
    {
      label: 'Profit',
      data: [10, 20, 30],
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    },
  ],
};
```

---

## Working with Events

react-chartjs-2 provides helper functions to extract data from click events.

### Click Events

```jsx
import { useRef } from 'react';
import { Bar } from 'react-chartjs-2';

function ChartWithClick() {
  const chartRef = useRef(null);

  const onClick = (event) => {
    const chart = chartRef.current;
    
    if (!chart) {
      return;
    }

    console.log('Chart clicked:', event);
    // Access chart instance
    console.log('Chart instance:', chart);
  };

  return (
    <Bar
      ref={chartRef}
      data={data}
      options={options}
      onClick={onClick}
    />
  );
}
```

### getDatasetAtEvent

Get the entire dataset that was clicked:

```jsx
import { useRef } from 'react';
import { Bar, getDatasetAtEvent } from 'react-chartjs-2';

function App() {
  const chartRef = useRef();

  const onClick = (event) => {
    const dataset = getDatasetAtEvent(chartRef.current, event);
    console.log('Clicked dataset:', dataset);
  };

  return (
    <Bar
      ref={chartRef}
      data={data}
      onClick={onClick}
    />
  );
}
```

### getElementAtEvent

Get a single data point that was clicked:

```jsx
import { useRef } from 'react';
import { Bar, getElementAtEvent } from 'react-chartjs-2';

function App() {
  const chartRef = useRef();

  const onClick = (event) => {
    const element = getElementAtEvent(chartRef.current, event);
    
    if (element.length > 0) {
      const { datasetIndex, index } = element[0];
      console.log('Dataset index:', datasetIndex);
      console.log('Data index:', index);
      console.log('Value:', data.datasets[datasetIndex].data[index]);
    }
  };

  return (
    <Bar
      ref={chartRef}
      data={data}
      onClick={onClick}
    />
  );
}
```

### getElementsAtEvent

Get all data points at the clicked position (useful for stacked charts):

```jsx
import { useRef } from 'react';
import { Bar, getElementsAtEvent } from 'react-chartjs-2';

function App() {
  const chartRef = useRef();

  const onClick = (event) => {
    const elements = getElementsAtEvent(chartRef.current, event);
    console.log('All elements at click:', elements);
    
    elements.forEach(element => {
      const { datasetIndex, index } = element;
      const value = data.datasets[datasetIndex].data[index];
      console.log(`Dataset ${datasetIndex}, Index ${index}: ${value}`);
    });
  };

  return (
    <Bar
      ref={chartRef}
      data={data}
      onClick={onClick}
    />
  );
}
```

### Hover Events

```jsx
const options = {
  onHover: (event, activeElements) => {
    if (activeElements.length > 0) {
      console.log('Hovering over:', activeElements);
    }
  }
};

<Bar data={data} options={options} />
```

---

## Using Refs

Access the Chart.js instance using refs:

### Basic Ref Usage

```jsx
import { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

function ChartWithRef() {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = chartRef.current;
    
    if (chart) {
      console.log('Chart instance:', chart);
      console.log('Chart data:', chart.data);
      console.log('Chart options:', chart.options);
    }
  }, []);

  return <Line ref={chartRef} data={data} options={options} />;
}
```

### Programmatic Chart Updates

```jsx
import { useRef } from 'react';
import { Line } from 'react-chartjs-2';

function ChartControls() {
  const chartRef = useRef(null);

  const updateChart = () => {
    const chart = chartRef.current;
    
    if (chart) {
      // Update data
      chart.data.datasets[0].data.push(Math.random() * 100);
      chart.update();
    }
  };

  const resetZoom = () => {
    const chart = chartRef.current;
    if (chart) {
      chart.resetZoom();
    }
  };

  return (
    <div>
      <Line ref={chartRef} data={data} options={options} />
      <button onClick={updateChart}>Update</button>
      <button onClick={resetZoom}>Reset Zoom</button>
    </div>
  );
}
```

### Accessing Canvas Context

```jsx
import { useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

function ChartWithContext() {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = chartRef.current;
    
    if (chart) {
      const ctx = chart.ctx;  // Canvas 2D context
      const canvas = chart.canvas;  // Canvas element
      
      console.log('Canvas context:', ctx);
      console.log('Canvas element:', canvas);
    }
  }, []);

  return <Bar ref={chartRef} data={data} options={options} />;
}
```

---

## TypeScript Support

react-chartjs-2 has full TypeScript support.

### Basic Typing

```typescript
import { ChartData, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

const options: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
  },
};

const data: ChartData<'line'> = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [
    {
      label: 'Dataset 1',
      data: [65, 59, 80],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
  ],
};

function App() {
  return <Line options={options} data={data} />;
}
```

### Typed Props Interface

```typescript
import { ChartData, ChartOptions } from 'chart.js';

interface LineChartProps {
  options: ChartOptions<'line'>;
  data: ChartData<'line'>;
}

function LineChart({ options, data }: LineChartProps) {
  return <Line options={options} data={data} />;
}
```

### Available Chart Types

Generic types accept these values:

- `'bar'`
- `'line'`
- `'scatter'`
- `'bubble'`
- `'pie'`
- `'doughnut'`
- `'polarArea'`
- `'radar'`

### Typed Refs

```typescript
import { useRef } from 'react';
import { Chart as ChartJS } from 'chart.js';
import { Line } from 'react-chartjs-2';

function App() {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const handleClick = () => {
    if (chartRef.current) {
      console.log(chartRef.current.data);
    }
  };

  return (
    <>
      <Line ref={chartRef} data={data} options={options} />
      <button onClick={handleClick}>Log Data</button>
    </>
  );
}
```

---

## Common Patterns

### Responsive Chart

```jsx
import { Line } from 'react-chartjs-2';

const options = {
  responsive: true,
  maintainAspectRatio: false,
};

function ResponsiveChart() {
  return (
    <div style={{ height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
}
```

### Loading State

```jsx
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

function ChartWithLoading() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data
    fetch('/api/chart-data')
      .then(res => res.json())
      .then(chartData => {
        setData(chartData);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading chart...</div>;
  }

  return <Bar data={data} />;
}
```

### Custom Tooltips

```jsx
const options = {
  plugins: {
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          label += new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(context.parsed.y);
          return label;
        }
      }
    }
  }
};

<Line data={data} options={options} />
```

### Custom Legend

```jsx
import { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';

function ChartWithCustomLegend() {
  const chartRef = useRef(null);
  const [hiddenDatasets, setHiddenDatasets] = useState(new Set());

  const toggleDataset = (index) => {
    const chart = chartRef.current;
    
    if (chart) {
      const isHidden = chart.isDatasetVisible(index);
      
      if (isHidden) {
        chart.hide(index);
        setHiddenDatasets(prev => new Set(prev).add(index));
      } else {
        chart.show(index);
        setHiddenDatasets(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    }
  };

  return (
    <div>
      <div>
        {data.datasets.map((dataset, index) => (
          <button
            key={index}
            onClick={() => toggleDataset(index)}
            style={{
              textDecoration: hiddenDatasets.has(index) ? 'line-through' : 'none'
            }}
          >
            {dataset.label}
          </button>
        ))}
      </div>
      <Line ref={chartRef} data={data} options={{ plugins: { legend: { display: false } } }} />
    </div>
  );
}
```

### Gradient Background

```jsx
import { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

function GradientChart() {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(255, 99, 132, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 99, 132, 0.1)');

    setChartData({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [
        {
          label: 'Sales',
          data: [65, 59, 80, 81, 56],
          backgroundColor: gradient,
          borderColor: 'rgba(255, 99, 132, 1)',
          fill: true,
        },
      ],
    });
  }, []);

  return chartData ? <Line ref={chartRef} data={chartData} /> : <div>Loading...</div>;
}
```

### Multi-Axis Chart

```jsx
const options = {
  scales: {
    y: {
      type: 'linear',
      position: 'left',
    },
    y1: {
      type: 'linear',
      position: 'right',
      grid: {
        drawOnChartArea: false,
      },
    },
  },
};

const data = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [
    {
      label: 'Dataset 1',
      data: [65, 59, 80],
      yAxisID: 'y',
    },
    {
      label: 'Dataset 2',
      data: [28, 48, 40],
      yAxisID: 'y1',
    },
  ],
};

<Line data={data} options={options} />
```

---

## Best Practices

### 1. Register Components Once

Register Chart.js components at the top level, not inside components:

```jsx
// ✅ Good - register once
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement);

function App() {
  return <Bar data={data} />;
}

// ❌ Bad - registers on every render
function App() {
  ChartJS.register(CategoryScale, LinearScale, BarElement);
  return <Bar data={data} />;
}
```

### 2. Memoize Data and Options

Prevent unnecessary re-renders by memoizing data and options:

```jsx
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

function Chart({ rawData }) {
  const data = useMemo(() => ({
    labels: rawData.labels,
    datasets: rawData.datasets,
  }), [rawData]);

  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
  }), []);

  return <Line data={data} options={options} />;
}
```

### 3. Use Dataset Identifiers

Always provide unique identifiers for datasets:

```jsx
// ✅ Good - unique labels
const data = {
  datasets: [
    { label: 'Sales', data: [...] },
    { label: 'Revenue', data: [...] },
  ]
};

// Or specify custom key
<Line datasetIdKey='id' data={...} />
```

### 4. Clean Up Refs

Charts are automatically cleaned up, but if you manipulate them manually, ensure proper cleanup:

```jsx
useEffect(() => {
  const chart = chartRef.current;
  
  if (chart) {
    // Do something with chart
  }

  return () => {
    // Cleanup if needed
    if (chart) {
      // chart.destroy() is called automatically
    }
  };
}, []);
```

### 5. Handle Loading States

Always handle loading and error states:

```jsx
function ChartComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <Bar data={data} />;
}
```

### 6. Optimize Re-renders

Use `updateMode` prop to control animation behavior:

```jsx
// Disable animation for frequent updates
<Line data={data} updateMode='none' />

// Only animate active elements
<Line data={data} updateMode='active' />
```

### 7. Use Proper TypeScript Types

Always type your chart data and options:

```typescript
import { ChartData, ChartOptions } from 'chart.js';

const data: ChartData<'line'> = { ... };
const options: ChartOptions<'line'> = { ... };
```

---

## Common Issues & Solutions

### Issue: Datasets Merging Together

**Problem:** Datasets merge when chart re-renders  
**Solution:** Add unique `label` or specify `datasetIdKey`:

```jsx
<Line
  datasetIdKey='id'
  data={{
    datasets: [
      { id: 1, data: [...] },
      { id: 2, data: [...] }
    ]
  }}
/>
```

### Issue: Chart Not Responsive

**Problem:** Chart doesn't resize with container  
**Solution:** Set responsive options and use container with defined size:

```jsx
const options = {
  responsive: true,
  maintainAspectRatio: false,
};

<div style={{ height: '400px' }}>
  <Line data={data} options={options} />
</div>
```

### Issue: Chart Not Updating

**Problem:** Data changes but chart doesn't update  
**Solution:** Ensure data object reference changes:

```jsx
// ✅ Good - creates new object
setData({ ...data, datasets: newDatasets });

// ❌ Bad - mutates existing object
data.datasets[0].data.push(5);
```

### Issue: TypeScript Errors

**Problem:** Type errors with chart data/options  
**Solution:** Import and use proper types:

```typescript
import { ChartData, ChartOptions } from 'chart.js';

const data: ChartData<'line'> = { ... };
const options: ChartOptions<'line'> = { ... };
```

### Issue: SSR Errors (Next.js)

**Problem:** `document is not defined` in Next.js  
**Solution:** Use dynamic import with no SSR:

```jsx
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('./Chart'), {
  ssr: false,
});
```

---

## Resources

- **Official Documentation:** https://react-chartjs-2.js.org
- **GitHub Repository:** https://github.com/reactchartjs/react-chartjs-2
- **Chart.js Documentation:** https://www.chartjs.org/docs/latest/
- **npm Package:** https://www.npmjs.com/package/react-chartjs-2
- **Stack Overflow:** Tag `react-chartjs-2`

### Related Libraries

- **Chart.js** - The underlying charting library
- **react-chartjs-2-typescript-example** - TypeScript examples
- **chartjs-plugin-zoom** - Add zoom/pan functionality
- **chartjs-plugin-datalabels** - Display data labels

---

**Last Updated:** 2025-10-02  
**Version:** react-chartjs-2 v5.x with Chart.js v4.x

