export class Utils {
    getTrimmedText(textAreaElement) {
        return textAreaElement.value.trim();
    }
    getCurrentDateTime() {
        return new Date().toLocaleString("ru-RU", {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric"
        });
    }
}
