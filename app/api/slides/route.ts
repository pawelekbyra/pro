import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    // Construct the path to the data.json file
    const jsonDirectory = path.join(process.cwd(), 'data.json');
    // Read the file contents
    const fileContents = await fs.readFile(jsonDirectory, 'utf8');
    // Parse the JSON data
    const data = JSON.parse(fileContents);

    // Return the data as a JSON response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading data.json:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
