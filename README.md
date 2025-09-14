
# Responsive Image Generator

Generate responsive image tags and assets directly from VS Code.

## Features

- Add a new responsive image tag using completion (type `<responsive_image_basic>` and select the completion).
- Prompts for image file(s), output directory, and sizes.
- Automatically generates resized images and fills in the `srcset` and `sizes` attributes.
- Works in HTML, Markdown, JavaScript, TypeScript, Vue, and Angular files.

## Requirements

- Requires [Sharp](https://www.npmjs.com/package/sharp) (installed automatically).
- No additional configuration required for basic usage.

## Usage

1. Type `<responsive_image_basic>` in a supported file and trigger completion (Ctrl+Space).
2. Select the completion item.
3. Follow the prompts to select image(s), output folder, and sizes.
4. The extension generates responsive images and inserts a complete `<img>` tag with `srcset` and `sizes`.

## Extension Settings

This extension does not currently contribute any settings.

## Known Issues

- Completion may not trigger automatically in all contexts; use Ctrl+Space if needed.
- Only works in supported file types (HTML, Markdown, JS, TS, Vue, Angular).
- Large images or many sizes may take time to process.

## Release Notes

### 1.0.0

- Added command for responsive image generation.
- Added support for multiple languages and snippet insertion.

---

**Enjoy using Responsive Image Generator!**

**(Catalyst.Responsive-Image-Generator)** - By [ColtMcG0](https://github.com/ColtMcG1)