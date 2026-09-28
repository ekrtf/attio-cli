let verboseErrors = false;

export function setVerboseErrors(enabled: boolean): void {
  verboseErrors = enabled;
}

export function reportError(error: unknown): never {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    if (verboseErrors && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
  throw error;
}
