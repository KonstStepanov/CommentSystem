export class Utils {
     public getTrimmedText(textAreaElement: HTMLTextAreaElement): string {
        return textAreaElement.value.trim();
    }

    public getCurrentDateTime(): string {
        return new Date().toLocaleString("ru-RU", {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric"
        });
    }
}