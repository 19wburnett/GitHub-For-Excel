# Excel Comparison Tool

A powerful web-based tool for comparing Excel files and analyzing changes in formulas, values, and structure.

## ✨ Features

- **📊 Excel File Comparison**: Compare two Excel files side-by-side
- **🔍 Formula Analysis**: Detect and analyze formula changes
- **📈 Value Impact Tracking**: See how formula changes affect calculated values
- **🎯 Smart Filtering**: Filter by change type, formula changes, and search
- **📋 Detailed Reporting**: Comprehensive change summaries and statistics
- **💻 Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🚀 Deployment to Vercel

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/) installed
- [Vercel CLI](https://vercel.com/cli) (optional, for advanced deployment)

### Quick Deploy (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project
   - Click "Deploy"

3. **Environment Setup**
   - No environment variables needed for basic functionality
   - Vercel will automatically install dependencies and build the project

### Manual Deployment with CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from your project directory**
   ```bash
   vercel
   ```

3. **Follow the prompts**
   - Link to existing project or create new
   - Confirm deployment settings
   - Wait for build and deployment

## 🔧 Configuration

### Vercel Settings
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)
- **Node.js Version**: 18.x (auto-detected)

### File Upload Limits
- **Maximum File Size**: 10MB per file (Vercel default)
- **Supported Formats**: `.xlsx`, `.xls`
- **Processing Time**: Up to 30 seconds per file

## 📱 Client Usage

### For Your Clients

1. **Access the Tool**
   - Share the Vercel deployment URL with your clients
   - No installation required - works in any modern browser

2. **Using the Tool**
   - **Upload Files**: Drag & drop or click to upload two Excel files
   - **View Results**: See a comprehensive comparison summary
   - **Analyze Changes**: Use filters to focus on specific types of changes
   - **Export Results**: Copy/paste or screenshot the results

3. **Supported Use Cases**
   - **Financial Models**: Compare budget versions, forecast updates
   - **Data Analysis**: Track changes in data processing workflows
   - **Reporting**: Identify modifications in report templates
   - **Audit Trails**: Document changes between file versions

## 🛠️ Development

### Local Development
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

## 📊 Performance

- **Build Time**: ~2-3 minutes on Vercel
- **Cold Start**: ~1-2 seconds
- **File Processing**: Up to 10MB files in under 30 seconds
- **Concurrent Users**: Supports multiple simultaneous users

## 🔒 Security

- **File Processing**: All processing happens server-side
- **No Data Storage**: Files are processed in memory and discarded
- **HTTPS Only**: Automatic SSL/TLS encryption on Vercel
- **Security Headers**: XSS protection, content type validation

## 📈 Scaling

- **Automatic Scaling**: Vercel handles traffic spikes automatically
- **Global CDN**: Content delivered from edge locations worldwide
- **Serverless Functions**: Pay only for actual usage
- **Monitoring**: Built-in analytics and error tracking

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Verify TypeScript compilation

2. **File Upload Issues**
   - Check file size limits (10MB max)
   - Ensure file format is .xlsx or .xls
   - Verify file isn't corrupted

3. **Formula Not Showing**
   - Check browser console for errors
   - Ensure Excel file contains actual formulas
   - Try with a simple test file first

### Support

- **Vercel Status**: [status.vercel.com](https://status.vercel.com)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **XLSX Library**: [github.com/SheetJS/sheetjs](https://github.com/SheetJS/sheetjs)

## 🎯 Next Steps

1. **Deploy to Vercel** using the steps above
2. **Test with your Excel files** to ensure formulas are working
3. **Share the URL** with your clients
4. **Monitor usage** through Vercel dashboard
5. **Gather feedback** and iterate on features

## 📝 License

This project is private and proprietary. All rights reserved.

---

**Ready to deploy?** Follow the deployment steps above and your clients will be using this powerful Excel comparison tool in minutes! 🚀
