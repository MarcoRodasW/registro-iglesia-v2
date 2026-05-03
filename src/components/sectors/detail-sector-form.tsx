import { CheckIcon, PencilLineIcon, XIcon } from "lucide-react";
import { type KeyboardEvent, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DetailSectorFormProps {
	name: string;
	description: string;
	onSave: (field: "name" | "description", value: string) => void;
}

export function DetailSectorForm({
	name,
	description,
	onSave,
}: DetailSectorFormProps) {
	return (
		<div className="grid gap-1 min-h-[84px] content-start">
			<InlineEditableInput
				value={name}
				onSave={(value) => onSave("name", value)}
			/>
			<InlineEditableTextarea
				value={description}
				placeholder="Agregar descripcion del sector..."
				onSave={(value) => onSave("description", value)}
			/>
		</div>
	);
}

interface InlineEditableInputProps {
	value: string;
	onSave: (value: string) => void;
}

function InlineEditableInput({ value, onSave }: InlineEditableInputProps) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);

	const startEditing = useCallback(() => {
		setDraft(value);
		setEditing(true);
	}, [value]);

	const cancel = useCallback(() => {
		setDraft(value);
		setEditing(false);
	}, [value]);

	const commit = useCallback(() => {
		const trimmed = draft.trim();
		if (trimmed === "" || trimmed === value) {
			cancel();
			return;
		}

		onSave(trimmed);
		setEditing(false);
	}, [cancel, draft, onSave, value]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				event.preventDefault();
				commit();
			}
			if (event.key === "Escape") {
				event.preventDefault();
				cancel();
			}
		},
		[cancel, commit],
	);

	if (editing) {
		return (
			<div className="flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 min-h-[38px]">
				<Input
					autoFocus
					value={draft}
					onFocus={(event) => event.currentTarget.select()}
					onChange={(event) => setDraft(event.currentTarget.value)}
					onBlur={commit}
					onKeyDown={handleKeyDown}
					className="max-w-80 font-heading font-semibold text-xl h-9"
					size="lg"
					nativeInput
				/>
				<div className="flex items-center gap-1 w-16 justify-end shrink-0">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 text-muted-foreground"
						onMouseDown={(event) => {
							event.preventDefault();
							commit();
						}}
					>
						<CheckIcon className="size-3.5" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 text-muted-foreground"
						onMouseDown={(event) => {
							event.preventDefault();
							cancel();
						}}
					>
						<XIcon className="size-3.5" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={startEditing}
			className="group flex items-center gap-2 rounded-lg px-1.5 py-0.5 text-left transition-colors hover:bg-muted/60 cursor-text min-h-[38px]"
		>
			<h2 className="font-heading font-semibold text-xl leading-none">
				{value}
			</h2>
			<PencilLineIcon className="size-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70" />
		</button>
	);
}

interface InlineEditableTextareaProps {
	value: string;
	placeholder: string;
	onSave: (value: string) => void;
}

function InlineEditableTextarea({
	value,
	placeholder,
	onSave,
}: InlineEditableTextareaProps) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);

	const startEditing = useCallback(() => {
		setDraft(value);
		setEditing(true);
	}, [value]);

	const cancel = useCallback(() => {
		setDraft(value);
		setEditing(false);
	}, [value]);

	const commit = useCallback(() => {
		const trimmed = draft.trim();
		if (trimmed === value) {
			setEditing(false);
			return;
		}

		onSave(trimmed);
		setEditing(false);
	}, [draft, onSave, value]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				commit();
			}
			if (event.key === "Escape") {
				event.preventDefault();
				cancel();
			}
		},
		[cancel, commit],
	);

	if (editing) {
		return (
			<div className="flex items-start gap-1.5 rounded-lg px-1.5 py-0.5 min-h-[38px]">
				<Textarea
					autoFocus
					value={draft}
					onFocus={(event) => {
						const { currentTarget } = event;
						currentTarget.setSelectionRange(
							currentTarget.value.length,
							currentTarget.value.length,
						);
					}}
					onChange={(event) => setDraft(event.currentTarget.value)}
					onBlur={commit}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="max-w-96 text-sm min-h-16"
					rows={2}
				/>
				<div className="flex items-center gap-1 w-16 justify-end shrink-0 mt-0.5">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 text-muted-foreground"
						onMouseDown={(event) => {
							event.preventDefault();
							commit();
						}}
					>
						<CheckIcon className="size-3.5" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-7 text-muted-foreground"
						onMouseDown={(event) => {
							event.preventDefault();
							cancel();
						}}
					>
						<XIcon className="size-3.5" />
					</Button>
				</div>
			</div>
		);
	}

	const displayText = value || placeholder;
	const isEmpty = value.length === 0;

	return (
		<button
			type="button"
			onClick={startEditing}
			className="group flex items-center gap-2 rounded-lg px-1.5 py-0.5 text-left transition-colors hover:bg-muted/60 cursor-text min-h-[38px]"
		>
			<p
				className={cn(
					"text-sm leading-relaxed",
					isEmpty ? "text-muted-foreground/50 italic" : "text-muted-foreground",
				)}
			>
				{displayText}
			</p>
			<PencilLineIcon className="size-3 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70 shrink-0" />
		</button>
	);
}
