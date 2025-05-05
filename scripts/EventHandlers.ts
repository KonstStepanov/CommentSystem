import {Utils} from "./Utils.js";
import {MessageService} from "./MessageService.js"

export class EventHandlers {
    public initMessageService(/* NOSONAR */
        messageService: MessageService,
                              textAreaElement: HTMLTextAreaElement,
                              sendButtonElement: HTMLButtonElement,
                              errorMessageElement: HTMLElement,
                              messageSizeElement: HTMLDivElement,
                              containerElement: HTMLElement,
                              filterButton: HTMLElement,
                              sortArrow: HTMLElement,
                              byDateOption: HTMLInputElement,
                              byMarksOption: HTMLInputElement,
                              byAnswersOption: HTMLInputElement,
                              DEFAULT_TEXT: string) {
        const MAX_LENGTH = 1000;

        textAreaElement.addEventListener("input", () => {
            textAreaElement.style.height = "auto";
            textAreaElement.style.height = textAreaElement.scrollHeight + "px";

            containerElement.style.height = "auto";
            containerElement.style.height = containerElement.scrollHeight + "px";

            const textLength = textAreaElement.value.length;
            if (textLength > 0 && textLength <= MAX_LENGTH) {
                messageSizeElement.textContent = `${textLength}/1000`;
                messageSizeElement.style.color = "";
                messageSizeElement.style.opacity = "";
                sendButtonElement.style.backgroundColor = "#ABD873";
                errorMessageElement.style.visibility = "hidden";
            } else if (textLength > MAX_LENGTH) {
                messageSizeElement.textContent = `${textLength}/1000`;
                messageSizeElement.style.color = "#FF0000";
                messageSizeElement.style.opacity = "100";
                sendButtonElement.style.backgroundColor = "";
                errorMessageElement.style.visibility = "visible";
            } else {
                messageSizeElement.textContent = DEFAULT_TEXT;
                messageSizeElement.style.color = "";
                messageSizeElement.style.opacity = "";
                sendButtonElement.style.backgroundColor = "";
                errorMessageElement.style.visibility = "hidden";
            }
        });

        sendButtonElement.addEventListener("click", () => {
            let utils: Utils = new Utils();
            const text = utils.getTrimmedText(textAreaElement);
            const avatarElement = document.getElementById("messageSendAvatar") as HTMLImageElement;
            const nameElement = document.getElementById("messageSendName") as HTMLParagraphElement;
            const currentDateTime = utils.getCurrentDateTime();

            if (!isValidMessage(text)) {
                console.error(text.length > MAX_LENGTH ? "Message is too long." : "Message is empty.");
                return;
            }

            const newMessage = messageService.createNewMessage(text, avatarElement, nameElement, currentDateTime);

            if (messageService.isReplyMode && messageService.replyToMessageId !== null) {
                messageService.handleReplyMode(newMessage);
            } else {
                messageService.handleNewMessage(newMessage);
            }

            messageService.resetTextArea();
            messageService.updateRandomUserMessage();
        });

        function isValidMessage(text: string): boolean {
            return text.length > 0 && text.length <= MAX_LENGTH;
        }

        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains("navigation-reply")) {
                const parentContainer = target.closest(".reply-container") as HTMLElement;
                const parentId = parseInt(parentContainer?.dataset.id ?? "0", 10);

                if (parentId) {
                    messageService.enableReplyMode(parentId);
                    console.log(`Reply mode activated for message ID: ${parentId}`);
                } else {
                    console.error("Parent message ID not found.");
                }
            }

            if (target.classList.contains("navigation-favorite")) {

                let parentContainer: HTMLElement | null;

                if (target.closest(".reply-container__reply")) {
                    parentContainer = target.closest(".reply-container__reply") as HTMLElement;
                } else {

                    parentContainer = target.closest(".reply-container") as HTMLElement;
                }

                if (!parentContainer) {
                    console.error("Parent container not found for favorite action.");
                    return;
                }

                const id = parseInt(parentContainer.dataset.id ?? "0", 10);
                if (isNaN(id) || id <= 0) {
                    console.error("Message or reply ID not found.");
                    return;
                }

                messageService.toggleFavorite(id);
            }
        });

        filterButton.addEventListener("click", () => {
            const isFilterActive = filterButton.classList.toggle("active");

            if (isFilterActive) {
                console.log("Filtering favorites...");
                messageService.filterFavorites();
            } else {
                console.log("Showing all messages...");
                messageService.showAllMessages();
            }
        });

        sortArrow.addEventListener("click", () => {
            messageService.isAscendingOrder = !messageService.isAscendingOrder;
            console.log(`Sort order changed to: ${messageService.isAscendingOrder ? 'Ascending' : 'Descending'}`);
            messageService.applySortOrder();
        });

        byDateOption.addEventListener("change", () => {
            if (byDateOption.checked) {
                messageService.applySortOrder();
            }
        });

        byMarksOption.addEventListener("change", () => {
            if (byMarksOption.checked) {
                messageService.applySortOrder();
            }
        });

        byAnswersOption.addEventListener("change", () => {
            if (byAnswersOption.checked) {
                messageService.applySortOrder();
            }
        });
    }
}