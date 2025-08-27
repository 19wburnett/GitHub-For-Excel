# Excel Compare App

A full-stack Next.js 13 web application that allows users to upload two Excel (.xlsx) files, parse them into JSON, and compare them cell by cell with visual diff highlighting.

## Features

### 🚀 Core Functionality
- **File Upload**: Drag & drop or click to upload Excel files (.xlsx, .xls)
- **Excel Parsing**: Parse Excel files including values, formulas, and cell metadata
- **Cell-by-Cell Comparison**: Compare all sheets, rows, and columns between files
- **Visual Diff Display**: Side-by-side comparison with color-coded changes
- **Formula Support**: Compare both cell values and formulas

### 🎨 User Interface
- **Modern Design**: Built with Tailwind CSS for a clean, responsive interface
- **Drag & Drop**: Intuitive file upload experience
- **Real-time Feedback**: Loading states and error handling
- **Responsive Layout**: Works on desktop and mobile devices

### 🔍 Comparison Features
- **Change Detection**: Identify added, removed, and modified cells
- **Sheet Navigation**: Browse through different sheets with change counts
- **Detailed View**: Toggle between showing values and formulas
- **Summary Statistics**: Overview of total changes across all sheets

### 🏗️ Architecture
- **Next.js 13**: Latest version with App Router
- **TypeScript**: Full type safety throughout the application
- **API Routes**: Serverless functions for file processing
- **Modular Structure**: Prepared for future features like branches and commits

## Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Excel Processing**: SheetJS (xlsx)
- **File Handling**: FormData API
- **Deployment**: Vercel-ready with serverless functions

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd excel-compare-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## Usage

### 1. Upload Files
- Drag and drop two Excel files or click to browse
- Supported formats: `.xlsx`, `.xls`
- Files are processed and parsed on the server

### 2. Compare Files
- Click the "Compare Files" button after uploading both files
- The system analyzes differences cell by cell
- Results are displayed in a structured format

### 3. Review Changes
- **Summary View**: Overview of added, removed, and changed cells
- **Sheet Navigation**: Switch between different sheets
- **Detailed Comparison**: View specific cell changes with old vs new values
- **Formula Toggle**: Show/hide formula comparisons

### 4. Understanding Results
- **Green**: Added cells (new in File 2)
- **Red**: Removed cells (deleted from File 1)
- **Yellow**: Changed cells (modified values or formulas)

## API Endpoints

### POST `/api/upload`
Upload and parse an Excel file.

**Request**: FormData with Excel file
**Response**: Parsed Excel data structure

### POST `/api/compare`
Compare two parsed Excel files.

**Request**: JSON with two file objects
**Response**: Comparison results with detailed diffs

## Project Structure

```
excel-compare-app/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts          # File upload and parsing
│   │   └── compare/
│   │       └── route.ts          # File comparison logic
│   ├── components/
│   │   ├── FileUpload.tsx        # File upload component
│   │   └── ComparisonResults.tsx # Results display component
│   ├── globals.css               # Global styles and Tailwind
│   ├── layout.tsx                # Root layout component
│   ├── page.tsx                  # Main page component
│   └── types.ts                  # TypeScript type definitions
├── package.json                  # Dependencies and scripts
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## Future Enhancements

The application is designed with a modular architecture to support future features:

- **Version Control**: Git-like branching and commit system
- **Multiple Comparisons**: Compare more than two files
- **Export Results**: Download comparison reports
- **Collaboration**: Share and comment on comparisons
- **Advanced Filtering**: Filter changes by type, sheet, or range
- **Batch Processing**: Compare multiple file pairs

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on push

### Other Platforms
The app uses standard Next.js features and can be deployed to:
- Netlify
- AWS Amplify
- Docker containers
- Traditional hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

---

Built with ❤️ using Next.js 13 and Tailwind CSS
