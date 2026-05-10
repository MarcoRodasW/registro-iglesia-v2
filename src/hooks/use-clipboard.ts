import { useCallback, useRef, useState } from "react";

export interface UseClipboardOptions {
	/** How long (ms) the `copied` state stays true. Default: 2000 */
	resetDelay?: number;
}

export interface UseClipboardReturn {
	copy: (text: string) => Promise<boolean>;
	copied: boolean;
	isSupported: boolean;
}

/**
 * A hook that copies text to the clipboard using the Clipboard API with a
 * legacy execCommand fallback for environments where the API is unavailable
 * (e.g. some mobile browsers or non-secure contexts).
 */
export function useClipboard(
	options: UseClipboardOptions = {},
): UseClipboardReturn {
	const { resetDelay = 2000 } = options;
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const resetDelayRef = useRef(resetDelay);
	resetDelayRef.current = resetDelay;

	const isSupported =
		typeof navigator !== "undefined" &&
		(!!navigator.clipboard || typeof document.execCommand === "function");

	const copy = useCallback(async (text: string): Promise<boolean> => {
		function scheduleReset() {
			setCopied(true);
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(
				() => setCopied(false),
				resetDelayRef.current,
			);
		}

		// Modern Clipboard API
		if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
			try {
				await navigator.clipboard.writeText(text);
				scheduleReset();
				return true;
			} catch {
				// Fall through to legacy method
			}
		}

		// Legacy fallback: create a temporary textarea and use execCommand
		if (typeof document !== "undefined") {
			try {
				const textarea = document.createElement("textarea");
				textarea.value = text;
				// Prevent scrolling on mobile
				textarea.style.cssText =
					"position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;border:none;padding:0;margin:0;";
				textarea.setAttribute("readonly", "");
				document.body.appendChild(textarea);
				textarea.focus();
				textarea.select();
				// For iOS Safari
				textarea.setSelectionRange(0, textarea.value.length);
				const success = document.execCommand("copy");
				document.body.removeChild(textarea);
				if (success) {
					scheduleReset();
					return true;
				}
			} catch {
				// Both methods failed
			}
		}

		return false;
	}, []);

	return { copy, copied, isSupported };
}
