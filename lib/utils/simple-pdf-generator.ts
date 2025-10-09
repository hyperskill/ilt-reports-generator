/**
 * PDF generator using html2pdf.js library
 * This library is specifically designed to handle HTML to PDF conversion
 * with proper support for charts, tables, and complex layouts
 */
export async function generateSimplePDFFromElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    if (!element) {
      throw new Error('Element not found');
    }

    
    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Wait for charts to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // CRITICAL: Convert all canvas to images AND add page breaks BEFORE pdf generation
    const canvasElements = element.querySelectorAll('canvas');
    
    for (let i = 0; i < canvasElements.length; i++) {
      const canvas = canvasElements[i] as HTMLCanvasElement;
      try {
        // Find parent container (go up 3-4 levels to find the card/block)
        let container = canvas.parentElement;
        let levelsUp = 0;
        while (container && levelsUp < 5) {
          // Look for a div that looks like a card/block container
          if (container.tagName === 'DIV' && container.children.length > 1) {
            break;
          }
          container = container.parentElement;
          levelsUp++;
        }
        
        if (container && i > 0) {
          // Add page break class to container (skip first chart)
          container.classList.add('force-page-break-before');
          container.style.pageBreakBefore = 'always';
          container.style.breakBefore = 'page';
        }
        
        // Convert to image
        const dataURL = canvas.toDataURL('image/png', 1.0);
        const img = document.createElement('img');
        img.src = dataURL;
        img.style.cssText = canvas.style.cssText;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.setAttribute('data-original-canvas', 'true');
        
        // Replace canvas with image
        if (canvas.parentNode) {
          canvas.parentNode.replaceChild(img, canvas);
        }
      } catch (error) {
        console.error(`   ❌ Error converting canvas ${i + 1}:`, error);
      }
    }
    
    
    // Configure html2pdf options
    const options = {
      margin: [10, 10, 10, 10] as [number, number, number, number], // top, right, bottom, left in mm
      filename: filename,
      image: { 
        type: 'jpeg' as const, 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        letterRendering: true,
        foreignObjectRendering: false, // Disable foreign object rendering to avoid CSS issues
        onclone: (clonedDoc: Document) => {
          
          // STEP 0: Expand all accordions BEFORE removing styles
          
          // Find all elements with data-state and change closed to open
          const dataStateElements = clonedDoc.querySelectorAll('[data-state="closed"]');
          dataStateElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            htmlEl.setAttribute('data-state', 'open');
          });
          
          // Find all accordion content and force them visible
          const accordionContents = clonedDoc.querySelectorAll('[role="region"]');
          accordionContents.forEach(content => {
            const htmlContent = content as HTMLElement;
            // Force inline styles to make visible
            htmlContent.style.cssText = 'display: block !important; height: auto !important; overflow: visible !important; opacity: 1 !important; visibility: visible !important;';
          });
          
          // Find any hidden divs that might be accordion content
          const allDivs = clonedDoc.querySelectorAll('div[style*="display: none"], div[style*="display:none"]');
          allDivs.forEach(div => {
            const htmlDiv = div as HTMLElement;
            // Check if it's inside an accordion
            const isInAccordion = htmlDiv.closest('[role="region"]') || htmlDiv.hasAttribute('data-state');
            if (isInAccordion) {
              htmlDiv.style.cssText = 'display: block !important; height: auto !important; overflow: visible !important;';
            }
          });
          
          // STEP 1: Remove ALL stylesheets and styles
          const allStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          allStyles.forEach(style => style.remove());
          
          // STEP 2: Remove inline styles but keep class names for our CSS selectors
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const htmlEl = el as HTMLElement;
            // Save canvas data before removing styles
            if (htmlEl.tagName === 'CANVAS') {
              return; // Don't touch canvas elements
            }
            // Don't remove styles from accordion content
            const isAccordionContent = htmlEl.hasAttribute('role') && htmlEl.getAttribute('role') === 'region';
            const hasDataState = htmlEl.hasAttribute('data-state');
            if (!isAccordionContent && !hasDataState) {
              htmlEl.removeAttribute('style');
              // Keep class names for our CSS selectors to work
              // htmlEl.removeAttribute('class'); // Commented out to preserve classes
            }
          });
          
          // STEP 3: Add completely clean, simple styles with accordion support
          const cleanStyle = clonedDoc.createElement('style');
          cleanStyle.textContent = `
            * {
              all: initial;
              display: revert;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              font-size: 12px;
              line-height: 1.6;
              color: #1a1a1a;
              background: white;
              padding: 20px;
              orphans: 3;
              widows: 3;
            }
            
            /* Headings */
            h1, h2, h3, h4, h5, h6 {
              font-weight: 600;
              margin: 20px 0 12px 0;
              color: #000;
              line-height: 1.3;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
            
            h1 { 
              font-size: 28px; 
              margin-bottom: 8px;
              font-weight: 700;
              page-break-after: avoid;
            }
            h2 { 
              font-size: 22px; 
              margin-top: 24px;
              page-break-after: avoid;
            }
            h3 { 
              font-size: 18px; 
              margin-top: 20px;
              page-break-after: avoid;
            }
            h4 { 
              font-size: 16px; 
              margin-top: 16px;
              page-break-after: avoid;
            }
            h5 { 
              font-size: 14px; 
              margin-top: 14px;
              page-break-after: avoid;
            }
            
            /* Text elements */
            p {
              margin: 8px 0;
              color: #1a1a1a;
              line-height: 1.6;
              orphans: 3;
              widows: 3;
            }
            
            /* Sections and Cards */
            div {
              margin: 0;
              padding: 0;
            }
            
            /* Card-like containers */
            [class*="Card"], [class*="card"], section {
              background: white;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              page-break-inside: avoid;
            }
            
            /* Flex containers */
            [class*="Flex"], [class*="flex"] {
              display: block;
              margin: 8px 0;
            }
            
            /* Box containers */
            [class*="Box"], [class*="box"] {
              display: block;
              margin: 12px 0;
            }
            
            /* Tables */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              border: 1px solid #d0d0d0;
              font-size: 11px;
            }
            
            th, td {
              border: 1px solid #d0d0d0;
              padding: 8px 10px;
              text-align: left;
              color: #1a1a1a;
              background: white;
            }
            
            th {
              background: #f5f5f5;
              font-weight: 600;
              color: #000;
            }
            
            tr:nth-child(even) {
              background: #fafafa;
            }
            
            /* Canvas and Images */
            canvas {
              display: block;
              max-width: 100%;
              height: auto;
              margin: 30px 0;
              border: 1px solid #e0e0e0;
              border-radius: 4px;
              padding: 8px;
              background: white;
              page-break-before: auto;
              page-break-after: auto;
              page-break-inside: avoid;
            }
            
            img {
              max-width: 100%;
              height: auto;
              margin: 12px 0;
              page-break-inside: avoid;
              break-inside: avoid;
              display: block;
            }
            
            /* Accordion regions */
            [role="region"] {
              display: block !important;
              height: auto !important;
              overflow: visible !important;
              opacity: 1 !important;
              visibility: visible !important;
              margin: 12px 0;
              padding: 12px;
              background: #fafafa;
              border-left: 3px solid #0066cc;
              border-radius: 4px;
            }
            
            /* Text sizes */
            [class*="size-1"] { font-size: 11px; }
            [class*="size-2"] { font-size: 12px; }
            [class*="size-3"] { font-size: 14px; }
            [class*="size-4"] { font-size: 16px; }
            [class*="size-5"] { font-size: 18px; }
            [class*="size-6"] { font-size: 20px; }
            [class*="size-7"] { font-size: 24px; }
            [class*="size-8"] { font-size: 28px; }
            
            /* Colors */
            [class*="color-gray"] { color: #666; }
            
            /* Spacing utilities */
            [class*="mb-1"] { margin-bottom: 4px !important; }
            [class*="mb-2"] { margin-bottom: 8px !important; }
            [class*="mb-3"] { margin-bottom: 12px !important; }
            [class*="mb-4"] { margin-bottom: 16px !important; }
            [class*="mb-5"] { margin-bottom: 20px !important; }
            
            [class*="mt-1"] { margin-top: 4px !important; }
            [class*="mt-2"] { margin-top: 8px !important; }
            [class*="mt-3"] { margin-top: 12px !important; }
            [class*="mt-4"] { margin-top: 16px !important; }
            [class*="mt-5"] { margin-top: 20px !important; }
            
            [class*="gap-1"] > * { margin-bottom: 4px; }
            [class*="gap-2"] > * { margin-bottom: 8px; }
            [class*="gap-3"] > * { margin-bottom: 12px; }
            [class*="gap-4"] > * { margin-bottom: 16px; }
            [class*="gap-5"] > * { margin-bottom: 20px; }
            
            /* Page breaks */
            .page-break-before { 
              page-break-before: always; 
            }
            .page-break-after { 
              page-break-after: always; 
            }
            
            /* Avoid breaking these elements */
            canvas, table, [role="region"], [class*="Card"], section, .chart-wrapper {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              -webkit-column-break-inside: avoid !important;
            }
            
            /* Chart wrapper specific styles */
            .chart-wrapper {
              display: block !important;
              margin: 30px 0 !important;
              padding: 20px !important;
              background: white !important;
              border: 1px solid #e0e0e0 !important;
              border-radius: 8px !important;
              page-break-before: always !important;
              break-before: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Force page break before blocks containing charts */
            .force-page-break-before {
              page-break-before: always !important;
              break-before: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: block !important;
            }
            
            img[data-original-canvas] {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Keep heading with following content */
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
            
            /* Prevent orphans and widows */
            p, div, li {
              orphans: 3;
              widows: 3;
            }
          `;
          clonedDoc.head.appendChild(cleanStyle);
          
          // STEP 4: Ensure all accordion content is visible with clean styles
          const allAccordionRegions = clonedDoc.querySelectorAll('[role="region"]');
          allAccordionRegions.forEach(region => {
            const htmlRegion = region as HTMLElement;
            htmlRegion.style.display = 'block';
            htmlRegion.style.height = 'auto';
            htmlRegion.style.maxHeight = 'none';
            htmlRegion.style.overflow = 'visible';
            htmlRegion.style.opacity = '1';
            htmlRegion.style.visibility = 'visible';
          });
          
          // STEP 5: Verify page breaks are preserved
          const pageBreakElements = clonedDoc.querySelectorAll('.force-page-break-before');
          
          pageBreakElements.forEach((el, index) => {
            const htmlEl = el as HTMLElement;
            // Ensure the styles are preserved
            if (!htmlEl.style.pageBreakBefore) {
              htmlEl.style.pageBreakBefore = 'always';
              htmlEl.style.breakBefore = 'page';
            }
          });
          
          // STEP 6: Hide elements marked with data-pdf-hide
          const elementsToHide = clonedDoc.querySelectorAll('[data-pdf-hide]');
          elementsToHide.forEach(el => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.display = 'none';
          });
          
        }
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4' as const, 
        orientation: 'portrait' as const,
        compress: true
      },
      pagebreak: { 
        mode: ['css', 'legacy'],
        before: ['.page-break-before', '.force-page-break-before'],
        after: '.page-break-after',
        avoid: ['.force-page-break-before', 'img[data-original-canvas]', 'table', '.chart-wrapper']
      }
    };
    
    
    // Generate PDF
    await html2pdf()
      .set(options)
      .from(element)
      .save();
    
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  }
}
