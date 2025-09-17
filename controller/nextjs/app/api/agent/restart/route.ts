import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentUrl } = body;

    if (!agentUrl) {
      return NextResponse.json(
        { success: false, error: 'Agent URL is required' },
        { status: 400 }
      );
    }

    // Forward request to agent
    const response = await fetch(`${agentUrl}/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error restarting agent:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}