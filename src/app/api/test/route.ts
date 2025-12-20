import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de test simple pour vérifier la connectivité depuis MetaTrader
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'Serveur accessible',
      timestamp: new Date().toISOString()
    },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    return NextResponse.json(
      {
        status: 'ok',
        message: 'POST reçu avec succès',
        body: body,
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}
