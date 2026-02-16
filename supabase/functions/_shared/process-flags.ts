/**
 * Shared helper to check process kill-switch flags from feature_flags table.
 * Each process has a flag like 'process_scans', 'process_availability', etc.
 * When disabled (is_enabled = false), the process should not start.
 */

export async function isProcessEnabled(
  supabase: any,
  processName: string
): Promise<boolean> {
  try {
    const flagName = `process_${processName}`;
    const { data, error } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('name', flagName)
      .maybeSingle();

    if (error) {
      console.warn(`⚠️ Failed to check process flag ${flagName}:`, error.message);
      return true; // Default to enabled if we can't check
    }

    if (!data) {
      console.warn(`⚠️ Process flag ${flagName} not found — defaulting to enabled`);
      return true;
    }

    if (!data.is_enabled) {
      console.log(`🚫 Process ${processName} is DISABLED via kill switch`);
    }

    return data.is_enabled ?? true;
  } catch (err) {
    console.warn(`⚠️ Error checking process flag:`, err);
    return true; // Default to enabled on error
  }
}
