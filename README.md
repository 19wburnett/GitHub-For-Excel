# Excel Comparison Tool

A Next.js application for comparing Excel files, identifying changes in values and formulas.

## Features

- **File Upload**: Upload two Excel files for comparison.
- **Detailed Comparison**: View differences in cell values and formulas.
- **Sorting and Filtering**: Sort by columns and filter by change type or formula modifications.
- **Formula Analysis**: Detailed breakdown of formula changes (references, functions).
- **Value Impact**: Visual indicators for value changes (increase/decrease).

## Quick Deploy to Vercel

1. Click "Deploy to Vercel" button or use Vercel CLI: `vercel`
2. Configure environment variables in Vercel dashboard (see Configuration section).
3. After deployment, access the app via the provided URL.

## Manual Deployment (Vercel CLI)

```bash
# Clone repository
git clone <repository-url>
cd excel-compare-app

# Install dependencies
npm install

# Deploy to Vercel
vercel
```

## Configuration

Ensure these environment variables are set in Vercel dashboard or `.env.local` for local development:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key for public access.

## Setting Up Supabase

1. **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2. **Set Up Storage**: In your Supabase dashboard, go to the "Storage" section and create a new bucket named `excel-files`. Make sure it's public if you want anyone to upload files without authentication.
3. **Get Credentials**: From your Supabase dashboard, get your project URL and anonymous key.
4. **Add Credentials to Vercel**: In your Vercel dashboard, go to your project settings, and under "Environment Variables", add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the values from Supabase.
5. **Local Development**: For local development, create a `.env.local` file in the root of your project and add the same environment variables.

## Client Usage

1. Upload first Excel file.
2. Upload second Excel file.
3. View comparison results with sorting/filtering options.
4. Use "Formula Changes Analysis" for detailed formula insights.

## Troubleshooting

- **Upload Errors**: Ensure files are valid Excel formats (.xlsx, .xls).
- **Comparison Errors**: Check file sizes; very large files may timeout (consider breaking into smaller comparisons).
- **Formula Not Showing**: Ensure formulas are correctly formatted in Excel.
- **Vercel Deployment Issues**: Verify environment variables are set and redeploy.
- **Supabase Issues**: Ensure your Supabase bucket is set up correctly and the credentials are accurate in your environment variables.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
