/**
 * Device Auth Controller
 *
 * HTTP controller for OAuth 2.0 Device Authorization Grant endpoints.
 * These endpoints enable CLI browser-based authentication.
 */

import { HttpError } from '@oxlayer/foundation-http-kit';
import { DeviceAuthService } from '../services/device-auth.service.js';
import type { Environment } from '../domain/index.js';

export interface InitiateAuthBody {
  deviceName: string;
  environment: Environment;
  scopes?: string[];
}

export interface PollBody {
  deviceCode: string;
}

export interface ApproveBody {
  userCode: string;
}

/**
 * Controller for device authorization
 */
export class DeviceAuthController {
  constructor(
    private readonly deviceAuthService: DeviceAuthService,
    private readonly getDeveloperId: (request: Request) => string,
    private readonly getOrganizationId: (request: Request) => string
  ) { }

  /**
   * POST /v1/cli/device/code
   *
   * Initiate device authorization flow.
   * CLI calls this to get a device code and user code.
   */
  async initiateDeviceAuth(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as InitiateAuthBody;

      if (!body.deviceName) {
        throw new HttpError(400, 'Missing required field: deviceName');
      }
      if (!body.environment) {
        throw new HttpError(400, 'Missing required field: environment');
      }

      const baseUrl = this.getBaseUrl(request);

      const result = await this.deviceAuthService.initiateDeviceAuth(
        body,
        baseUrl
      );

      return Response.json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error(error);
      throw new HttpError(500, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  /**
   * POST /v1/cli/device/poll
   *
   * Poll for token completion.
   * CLI calls this repeatedly until user approves or session expires.
   */
  async pollForToken(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as PollBody;

      if (!body.deviceCode) {
        throw new HttpError(400, 'Missing required field: deviceCode');
      }

      const result = await this.deviceAuthService.pollForToken(body);

      if (result.error) {
        throw new HttpError(400, result.error);
      }

      return Response.json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  /**
   * GET /device
   *
   * Browser verification page.
   * User visits this page to approve the device authorization.
   */
  async showDevicePage(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code') || '';
    const error = url.searchParams.get('error');

    const html = this.renderDevicePage(code, error || null);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  /**
   * POST /v1/cli/device/approve
   *
   * Approve a device authorization.
   * Called by browser after user logs in and confirms approval.
   */
  async approveDevice(request: Request): Promise<Response> {
    try {
      const developerId = this.getDeveloperId(request);
      const organizationId = this.getOrganizationId(request);

      const body = (await request.json()) as ApproveBody;

      if (!body.userCode) {
        throw new HttpError(400, 'Missing required field: userCode');
      }

      await this.deviceAuthService.approveDevice({
        userCode: body.userCode,
        developerId,
        organizationId,
      });

      return Response.json({
        success: true,
        message: 'Device approved successfully',
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Invalid user code') {
        throw new HttpError(404, 'Invalid user code');
      }
      console.log(error);
      throw new HttpError(500, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  /**
   * GET /v1/cli/device/status
   *
   * Get the current status of a device authorization.
   * Called by browser to poll for approval status.
   */
  async getDeviceStatus(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new HttpError(400, 'Missing required parameter: code');
    }

    const session = await this.deviceAuthService.findByUserCode(code);

    if (!session) {
      throw new HttpError(404, 'Device session not found');
    }

    return Response.json({
      data: {
        approved: session.isValid(),
        status: session.status,
      },
    });
  }

  /**
   * Get base URL from request
   */
  private getBaseUrl(request: Request): string {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  /**
   * Render device approval page HTML
   */
  private renderDevicePage(userCode: string, error: string | null): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OxLayer — Device Authorization</title>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f0f0f;
      color: #e5e5e5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .container {
      background: #171717;
      border: 1px solid #262626;
      padding: 40px;
      max-width: 480px;
      width: 100%;
    }

    h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 24px;
      letter-spacing: -0.01em;
    }

    .instructions {
      color: #a3a3a3;
      line-height: 1.6;
      font-size: 14px;
      margin-bottom: 20px;
    }

    .code-display {
      background: #111111;
      border: 1px solid #2a2a2a;
      padding: 18px;
      text-align: center;
      margin: 24px 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 6px;
      color: #ffffff;
    }

    .btn {
      background: #262626;
      color: #ffffff;
      border: 1px solid #333333;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: #2f2f2f;
      border-color: #404040;
    }

    .btn:active {
      background: #3a3a3a;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error {
      background: #1f1111;
      border: 1px solid #3a1a1a;
      color: #f87171;
      padding: 12px;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .success {
      color: #4ade80;
    }

    .spinner {
      display: none;
      width: 16px;
      height: 16px;
      border: 2px solid #555;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading .spinner { display: block; }
    .loading .btn-text { display: none; }

    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }

  </style>
</head>

<body>
  <div class="container">
    <h1>Authorize Device</h1>

    ${error ? `<div class="error">${this.escapeHtml(error)}</div>` : ''}

    <p class="instructions">
      A device is requesting access to your OxLayer account.
      Enter the following code in your CLI to continue:
    </p>

    <div class="code-display">
      ${this.escapeHtml(userCode || '---- ----')}
    </div>

    <p class="instructions">
      Once approved, this page will automatically update.
    </p>

    <button id="approveBtn" class="btn" onclick="approveDevice()">
      <span class="btn-text">Approve Device</span>
      <span class="spinner"></span>
    </button>

    <div class="footer">
      Secure device authentication flow
    </div>
  </div>

<script>
  const userCode = '${this.escapeHtml(userCode)}';

  async function approveDevice() {
    const btn = document.getElementById('approveBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      const response = await fetch('/v1/cli/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode })
      });

      if (response.ok) {
        document.querySelector('.container').innerHTML = \`
          <h1 class="success">Authorization Complete</h1>
          <p class="instructions">
            You may close this window and return to your CLI.
          </p>
        \`;
      } else {
        throw new Error();
      }
    } catch {
      btn.classList.remove('loading');
      btn.disabled = false;
      alert('Failed to approve device. Please try again.');
    }
  }

  let pollCount = 0;
  const maxPolls = 60;

  async function pollStatus() {
    if (pollCount >= maxPolls) return;

    try {
      const response = await fetch('/v1/cli/device/status?code=' + encodeURIComponent(userCode));
      if (response.ok) {
        const data = await response.json();
        if (data.data.approved) {
          window.location.reload();
        }
      }
    } catch {}

    pollCount++;
    setTimeout(pollStatus, 5000);
  }

  if (userCode) {
    pollStatus();
  }
</script>

</body>
</html>`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m] || m);
  }
}
