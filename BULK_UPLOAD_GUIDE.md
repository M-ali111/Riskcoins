# Bulk Upload Students Guide

## Overview
The bulk upload feature allows you to import multiple students at once from a Google Sheet.

## Setup Instructions

### 1. Create a Google Sheet

Create a new Google Sheet with the following structure:

| Name | Email | House | Password |
|------|-------|-------|----------|
| John Doe | john@example.com | Gryffindor | temp123 |
| Jane Smith | jane@example.com | Slytherin | temp456 |
| Bob Wilson | bob@example.com | Hufflepuff | |

**Column Details:**
- **Column A (Name)**: Required - Student's full name
- **Column B (Email)**: Required - Student's email (must be unique)
- **Column C (House)**: Optional - House name (must match exactly with your house names)
- **Column D (Password)**: Optional - Temporary password (defaults to "student123" if empty)

### 2. Make Sheet Public

**IMPORTANT:** The sheet must be publicly accessible for the upload to work.

1. Click the "Share" button in the top right
2. Click "Change to anyone with the link"
3. Make sure it's set to "Viewer" access
4. Copy the share link

### 3. Upload via Admin Panel

1. Go to Admin Panel → Students
2. Click the "📊 Bulk Upload" button
3. Paste your Google Sheet URL
4. Enter the sheet name (default is "Sheet1")
5. Click "Upload Students"

### 4. Review Results

The system will show you:
- Total number of rows processed
- Successfully created students
- Failed entries with reasons (duplicate emails, invalid houses, etc.)

## Troubleshooting

### "Invalid spreadsheet ID or sheet is not publicly accessible"
- Make sure your Google Sheet is shared with "Anyone with the link can view"
- Double-check you copied the entire URL

### "House not found"
- House names must match exactly with your existing houses
- House names are case-insensitive
- Make sure the house exists in your system first

### "Email already exists"
- The system prevents duplicate emails
- Check if the student is already in the database

## Sample Google Sheet Template

You can create a test sheet with this format:

```
Name            | Email                  | House      | Password
----------------|------------------------|------------|----------
Alice Johnson   | alice@school.com       | Gryffindor | pass123
Bob Smith       | bob@school.com         | Ravenclaw  | pass456
Carol Davis     | carol@school.com       | Hufflepuff |
David Lee       | david@school.com       | Slytherin  | pass789
```

## Notes

- First row is always treated as headers and will be skipped
- Empty rows are automatically skipped
- If no password is provided, "student123" will be used as default
- Students are created with `isEmailVerified: false` by default
- All emails are automatically converted to lowercase
