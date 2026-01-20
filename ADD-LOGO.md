# How to Add Your Logo

## Quick Steps

1. **Save your logo file as `logo.png`**
   - Use PNG format with transparent background (recommended)
   - Optimal dimensions: 200-300px width, 50-80px height
   - Place it in the project root directory (same folder as index.html)

2. **Update index.html** (if using PNG instead of SVG)

   Open `index.html` and find line 20:
   ```html
   <img src="logo.svg" alt="Dsign Accounting Logo" class="logo-img">
   ```

   Change to:
   ```html
   <img src="logo.png" alt="Dsign Accounting Logo" class="logo-img">
   ```

## Option 1: Using Your Current Logo (From the Image)

If you have your logo saved as an image file:
1. Save it as `logo.png` in this directory
2. Update line 20 in index.html as shown above
3. Done!

## Option 2: Keep Using SVG

The current `logo.svg` placeholder works fine. If you're happy with it, no changes needed!

## Option 3: Convert Your Logo to SVG

For the best quality and performance:
1. Use an online converter like:
   - https://convertio.co/png-svg/
   - https://image.online-convert.com/convert-to-svg
2. Save as `logo.svg` (will replace the placeholder)
3. No need to update index.html

## Checklist

- [ ] Logo file saved in project root
- [ ] Filename is either `logo.png` or `logo.svg`
- [ ] index.html updated to match filename (if using PNG)
- [ ] Logo is clear and readable at small sizes
- [ ] Transparent background (if PNG)

## Testing

After adding your logo:
1. Open `index.html` in a web browser
2. Check if the logo appears in the navigation bar
3. Try resizing the browser window to test responsiveness
4. Check mobile view (responsive design)

---

**Current Status:** Using placeholder SVG logo
**To Switch:** Add your logo file and update index.html line 20
