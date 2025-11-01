import { Header } from '@mockoon/commons';

/**
 * Builder for constructing cURL commands.
 */
export class CurlCommandBuilder {
  /**
   * Compression algorithms supported by cURL's --compressed flag
   */
  private static readonly COMPRESSION_ALGORITHMS =
    'gzip|deflate|br|compress|zstd';
  private readonly commandParts: string[] = ['curl'];
  private hasCompression = false;

  /**
   * Add --location flag to follow redirects
   */
  public withLocation(): this {
    this.commandParts.push('--location');

    return this;
  }

  /**
   * Add --compressed flag for compression support
   */
  public withCompression(): this {
    this.hasCompression = true;
    this.commandParts.push('--compressed');

    return this;
  }

  /**
   * Add HTTP method (GET, POST, HEAD, etc.)
   *
   * @param method - HTTP method name
   */
  public withMethod(method: string): this {
    const normalizedMethod = method.toLowerCase();
    if (normalizedMethod === 'head') {
      this.commandParts.push('--head');
    }

    this.commandParts.push('--request', method.toUpperCase());

    return this;
  }

  /**
   * Add target URL
   *
   * @param url - Full URL including protocol, host, path and query parameters
   */
  public withUrl(url: string): this {
    const escaped = this.escape(url);
    this.commandParts.push(this.quote(escaped));

    return this;
  }

  /**
   * Add a single header
   *
   * @param key - Header name
   * @param value - Header value
   */
  public withHeader(key: string, value: string): this {
    const escapedKey = this.escape(key);
    const escapedValue = this.escape(value);
    this.commandParts.push(
      '--header',
      this.quote(`${escapedKey}: ${escapedValue}`)
    );

    return this;
  }

  /**
   * Add multiple headers, automatically filtering out headers that should be skipped
   *
   * @param headers - Array of headers to add
   */
  public withHeaders(headers: Header[]): this {
    for (const header of headers) {
      if (!this.shouldSkipHeader(header.key)) {
        this.withHeader(header.key, header.value);
      }
    }

    return this;
  }

  /**
   * Add request body using --data-binary flag to preserve the exact body bytes
   *
   * @param body - Request body content
   */
  public withBody(body: string): this {
    if (body) {
      const escaped = this.escape(body);
      this.commandParts.push('--data-binary', this.quote(escaped));
    }

    return this;
  }

  /**
   * Detect if headers contain compression encoding and add compression flag if present
   *
   * @param headers - Array of headers to check
   */
  public withCompressionIfPresent(headers: Header[]): this {
    if (this.hasCompressionEncoding(headers)) {
      this.withCompression();
    }

    return this;
  }

  /**
   * Build and return the final cURL command string
   *
   * @returns Complete cURL command
   */
  public build(): string {
    return this.commandParts.join(' ');
  }

  /**
   * Check if request headers contain compression encoding
   *
   * @param headers - The request headers
   * @returns true if compression encoding is present
   */
  private hasCompressionEncoding(headers: Header[]): boolean {
    return headers.some((header) => {
      if (header.key.toLowerCase() !== 'accept-encoding') {
        return false;
      }
      const value = header.value.toLowerCase();

      return new RegExp(
        `\\b(${CurlCommandBuilder.COMPRESSION_ALGORITHMS})\\b`
      ).test(value);
    });
  }

  /**
   * Determine if a header should be skipped when generating cURL command
   *
   * @param key - Header key to check
   * @returns true if the header should be skipped
   */
  private shouldSkipHeader(key: string): boolean {
    const lowerKey = key.toLowerCase();

    // Skip content-length as curl calculates it automatically
    if (lowerKey === 'content-length') {
      return true;
    }

    // Skip accept-encoding if we're using --compressed flag
    if (lowerKey === 'accept-encoding' && this.hasCompression) {
      return true;
    }

    return false;
  }

  /**
   * Escape special characters for use in cURL command
   *
   * @param value - String to escape
   * @returns Escaped string
   */
  private escape(value: string): string {
    return value.replaceAll('"', String.raw`\"`);
  }

  /**
   * Wrap value in double quotes
   *
   * @param value - String to quote
   * @returns Quoted string
   */
  private quote(value: string): string {
    return `"${value}"`;
  }
}
