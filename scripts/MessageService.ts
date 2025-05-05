import {Message} from "./Message.js";
import {UserService} from "./User.js";
import {UIRenderer} from "./UIRenderer.js";

export class MessageService {
    private readonly messages: Message[] = [];
    private static readonly MESSAGES_KEY = "savedMessages";
    private static readonly TOTAL_COMMENTS_KEY = "totalComments";
    private static readonly FAVORITES_KEY = "favorites";
    private _isAscendingOrder: boolean = false;
    private readonly uiRenderer: UIRenderer = new UIRenderer();
    private readonly DEFAULT_TEXT: string;
    private readonly sortArrow: HTMLElement;
    private readonly byDateOption: HTMLInputElement;
    private readonly byMarksOption: HTMLInputElement;
    private readonly byAnswersOption: HTMLInputElement;
    private readonly textAreaElement: HTMLTextAreaElement;
    private readonly messageSizeElement: HTMLParagraphElement;
    private readonly sendButtonElement: HTMLButtonElement;
    private readonly containerElement: HTMLElement;
    private readonly errorMessageElement: HTMLElement;

    constructor( /* NOSONAR */
                 DEFAULT_TEXT: string,
                 sortArrow: HTMLElement,
                 byDateOption: HTMLInputElement,
                 byMarksOption: HTMLInputElement,
                 byAnswersOption: HTMLInputElement,
                 textAreaElement: HTMLTextAreaElement,
                 messageSizeElement: HTMLParagraphElement,
                 sendButtonElement: HTMLButtonElement,
                 containerElement: HTMLElement,
                 errorMessageElement: HTMLElement,
    ) {
        this.DEFAULT_TEXT = DEFAULT_TEXT;
        this.sortArrow = sortArrow;
        this.byDateOption = byDateOption;
        this.byMarksOption = byMarksOption;
        this.byAnswersOption = byAnswersOption;
        this.textAreaElement = textAreaElement;
        this.messageSizeElement = messageSizeElement;
        this.sendButtonElement = sendButtonElement;
        this.containerElement = containerElement;
        this.errorMessageElement = errorMessageElement;
        this.loadFromLocalStorage();
        this.loadFavoritesFromLocalStorage();
        this.initializeEventListeners();
    }

    get isAscendingOrder(): boolean {
        return this._isAscendingOrder;
    }

    set isAscendingOrder(value: boolean) {
        this._isAscendingOrder = value;
    }

    private loadFromLocalStorage(): void {
        const savedMessages = localStorage.getItem(MessageService.MESSAGES_KEY);
        if (savedMessages) {
            try {

                const parsedMessages = JSON.parse(savedMessages);

                this.messages.length = 0;

                parsedMessages.forEach((msgData: any) => {
                    const message = new Message(
                        msgData.id,
                        msgData.avatar,
                        msgData.username,
                        msgData.text,
                        msgData.dateTime,
                        msgData.rating
                    );

                    if (msgData.replies && Array.isArray(msgData.replies)) {
                        message.replies = msgData.replies.map((replyData: any) =>
                            new Message(
                                replyData.id,
                                replyData.avatar,
                                replyData.username,
                                replyData.text,
                                replyData.dateTime,
                                replyData.rating
                            )
                        );
                    }

                    this.messages.push(message);
                });

                console.log(`Loaded ${this.messages.length} messages from localStorage`);

                const savedCommentCount = localStorage.getItem(MessageService.TOTAL_COMMENTS_KEY);
                if (savedCommentCount) {
                    const commentsNumberElement = document.getElementById("commentsNumber");
                    if (commentsNumberElement) {
                        commentsNumberElement.textContent = `(${savedCommentCount})`;
                    }
                }

                this.refreshUI();
            } catch (error) {
                console.error("Error loading messages from localStorage:", error);
            }
        }
    }

    private loadFavoritesFromLocalStorage(): void {
        const savedFavorites = localStorage.getItem(MessageService.FAVORITES_KEY);
        if (savedFavorites) {
            try {
                const favoriteIds = JSON.parse(savedFavorites);
                this.favorites = new Set(favoriteIds);
                console.log(`Loaded ${this.favorites.size} favorites from localStorage`);

            } catch (error) {
                console.error("Error loading favorites from localStorage:", error);
            }
        }
    }

    private updateFavoritesUI(): void {

        this.favorites.forEach(id => {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                const favoriteIcon = element.querySelector(".navigation-favorite") as HTMLElement;
                const favoriteImg = element.querySelector(".navigation-fav-icon") as HTMLImageElement;

                if (favoriteIcon && favoriteImg) {
                    favoriteIcon.textContent = "В избранном";
                    favoriteImg.src = "./assets/favorite_icon.svg";
                }
            }
        });
    }

    public isReplyMode: boolean = false;
    public replyToMessageId: number | null = null;

    private favorites: Set<number> = new Set();

    public sendMessage(message: Message): void {
        if (this.isReplyMode && this.replyToMessageId !== null) {

            const parentMessage = this.messages.find((msg) => msg.id === this.replyToMessageId);
            if (parentMessage) {
                parentMessage.replies.push(message);
                console.log(`Reply added to message ID: ${this.replyToMessageId}`);
            } else {
                console.error(`Parent message with ID ${this.replyToMessageId} not found.`);
            }

            this.isReplyMode = false;
            this.replyToMessageId = null;
        } else {

            this.messages.push(message);
            const totalComments = this.updateCommentCount();
            this.saveToLocalStorage(totalComments);
        }
    }

    public enableReplyMode(parentMessageId: number): void {
        this.isReplyMode = true;
        this.replyToMessageId = parentMessageId;
        console.log(`Reply mode enabled for message ID: ${parentMessageId}`);
    }

    public addReply(parentMessageId: number, reply: Message): void {
        const parentMessage = this.messages.find((message) => message.id === parentMessageId);

        if (!parentMessage) {
            console.error(`Message with ID ${parentMessageId} not found. Cannot add reply.`);
            return;
        }

        parentMessage.replies.push(reply);
        this.saveToLocalStorage();
    }

    private saveToLocalStorage(totalComments?: number): void {
        localStorage.setItem(MessageService.MESSAGES_KEY, JSON.stringify(this.messages));
        if (totalComments !== undefined) {
            localStorage.setItem(
                MessageService.TOTAL_COMMENTS_KEY,
                totalComments.toString()
            );
        }
    }

    private updateCommentCount(): number {
        const commentsNumberElement = document.getElementById("commentsNumber");
        const totalComments =
            (parseInt(commentsNumberElement?.textContent?.replace(/[()]/g, "") ?? "0", 10) + 1) || 0;

        if (commentsNumberElement) {
            commentsNumberElement.textContent = `(${totalComments})`;
        }

        return totalComments;
    }

    public toggleFavorite(id: number): void {
        const element = document.querySelector(`[data-id="${id}"]`);

        if (!element) {
            console.error(`Element with ID ${id} not found in the DOM.`);
            return;
        }

        console.log("Element Found:", element);
        const favoriteIcon = element.querySelector(".navigation-favorite") as HTMLElement;
        const favoriteImg = element.querySelector(".navigation-fav-icon") as HTMLImageElement;

        if (!favoriteIcon || !favoriteImg) {
            console.error(`Favorite UI elements not found for ID: ${id}`);
            return;
        }

        if (this.favorites.has(id)) {

            this.favorites.delete(id);
            favoriteIcon.textContent = "В избранное";
            favoriteImg.src = "./assets/favorite_icon_unchecked.svg";
            console.log(`Removed from favorites: ${id}`);
        } else {

            this.favorites.add(id);
            favoriteIcon.textContent = "В избранном";
            favoriteImg.src = "./assets/favorite_icon.svg";
            console.log(`Added to favorites: ${id}`);
        }

        this.saveFavoritesToLocalStorage();
    }

    public filterFavorites(): void {
        const replyContainers = document.querySelectorAll(".reply-container");

        replyContainers.forEach((container) => {
            const favoriteElement = container.querySelector(".navigation-favorite") as HTMLElement;
            const messageContent = container.querySelector(".reply-container__message") as HTMLElement;
            const replies = container.querySelectorAll(".reply-container__reply");

            // Check if parent message is favorited
            const isParentFavorite = favoriteElement?.textContent?.trim() === "В избранном";

            // Show/hide parent message content based on its favorite status
            if (messageContent) {
                messageContent.style.display = isParentFavorite ? "" : "none";
            }

            // Process each reply in this container
            let hasVisibleReplies = false;
            replies.forEach((reply) => {
                const replyFavorite = reply.querySelector(".navigation-favorite") as HTMLElement;
                if (replyFavorite) {
                    const isReplyFavorite = replyFavorite.textContent?.trim() === "В избранном";
                    // Show/hide reply based on its favorite status
                    (reply as HTMLElement).style.display = isReplyFavorite ? "" : "none";

                    // Track if we have any visible replies
                    if (isReplyFavorite) {
                        hasVisibleReplies = true;
                    }
                }
            });

            // Show parent container only if:
            // 1. The parent message itself is favorited, or
            // 2. It contains at least one favorited reply
            (container as HTMLElement).style.display = (isParentFavorite || hasVisibleReplies) ? "" : "none";
        });
    }

    public showAllMessages(): void {
        // Show all containers and replies
        const allContainers = document.querySelectorAll(".reply-container, .reply-container__reply");
        allContainers.forEach((container) => {
            (container as HTMLElement).style.display = "";
        });

        // Also make sure all message content elements are visible
        const allMessageContents = document.querySelectorAll(".reply-container__message");
        allMessageContents.forEach((content) => {
            (content as HTMLElement).style.display = "";
        });
    }

    private saveFavoritesToLocalStorage(): void {
        localStorage.setItem(MessageService.FAVORITES_KEY, JSON.stringify(Array.from(this.favorites)));
    }

    private initializeEventListeners(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;

            if (target.classList.contains("navigation-mark_button-pointer-plus")) {
                this.updateMessageRating(target, 1);
            } else if (target.classList.contains("navigation-mark_button-pointer-minus")) {
                this.updateMessageRating(target, -1);
            }
        });
    }

    private updateMessageRating(target: HTMLElement, value: number): void {
        const parentContainer = target.closest(".reply-container, .reply-container__reply") as HTMLElement;
        if (!parentContainer) {
            console.error("Parent container not found for rating update.");
            return;
        }

        const id = parseInt(parentContainer.dataset.id ?? "0", 10);
        const message = this.findMessageById(id);
        if (!message) {
            console.error(`Message or reply with ID ${id} not found.`);
            return;
        }

        message.rating += value;

        const ratingElement = parentContainer.querySelector(".message-reply-message-text-mark-number") as HTMLElement;
        if (ratingElement) {
            const displayRating = Math.abs(message.rating);
            ratingElement.textContent = displayRating.toString();

            let color = "black"; // Default color
            if (message.rating > 0) {
                color = "green";
            } else if (message.rating < 0) {
                color = "red";
            }

            ratingElement.style.color = color;
        } else {
            console.error("Rating display element not found!");
        }


        this.saveToLocalStorage();
    }

    private findMessageById(id: number): Message | undefined {
        return this.messages.find(msg => msg.id === id) ||
            this.messages.reduce<Message[]>((acc, msg) => acc.concat(msg.replies), []).find(reply => reply.id === id);
    }

    public sortMessagesByRating(ascending: boolean = false): void {
        this.messages.sort((a, b) => ascending ? a.rating - b.rating : b.rating - a.rating);
        this.messages.forEach(msg => {
            msg.replies = msg.replies.toSorted((a, b) => ascending ? a.rating - b.rating : b.rating - a.rating);
        });

        console.log("Messages sorted by rating:", ascending ? "Ascending" : "Descending");
        this.refreshUI();
    }

    private parseDate(dateString: string): number {
        return new Date(dateString.split('.').reverse().join('-')).getTime();
    }

    public sortMessagesByDate(ascending: boolean = false): void {
        this.messages.sort((a, b) => ascending ? this.parseDate(a.dateTime) -
            this.parseDate(b.dateTime) : this.parseDate(b.dateTime) - this.parseDate(a.dateTime));

        this.messages.forEach(msg => {
            msg.replies.sort((a, b) => ascending ? this.parseDate(a.dateTime) -
                this.parseDate(b.dateTime) : this.parseDate(b.dateTime) - this.parseDate(a.dateTime));
        });

        console.log("Messages sorted by date:", ascending ? "Ascending" : "Descending");
        this.refreshUI();
    }


    public sortMessagesByReplies(ascending: boolean = false): void {
        this.messages.sort((a, b) => ascending ? a.replies.length - b.replies.length : b.replies.length - a.replies.length);
        console.log("Messages sorted by number of replies:", ascending ? "Ascending" : "Descending");
        this.refreshUI();
    }

    private refreshUI(): void {

        const commentsContainer = document.querySelector(".article-bottom-comments__container") as HTMLElement;
        const existingMessages = commentsContainer.querySelectorAll(".reply-container");
        existingMessages.forEach(message => {

            if (message.parentElement === commentsContainer) {
                message.remove();
            }
        });

        this.messages.forEach(message => {
            const messageElement = this.uiRenderer.createMessageElement(message);

            message.replies.forEach(reply => {
                const nameElement = messageElement.querySelector('.text-container__name');
                let messageAuthorName = "";
                if (nameElement) {
                    messageAuthorName = Array.from(nameElement.childNodes)
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent ? node.textContent.trim() : "")
                        .join("");
                }

                const replyElement = this.uiRenderer.createReplyElement(reply, messageAuthorName);
                messageElement.appendChild(replyElement);
            });

            commentsContainer.appendChild(messageElement);
        });

        this.updateFavoritesUI();
    }

    public applySortOrder() {
        const sortValueText = document.getElementById("sortValue") as HTMLElement;

        if (this.byDateOption.checked) {
            console.log(`Sorting by date... (${this.isAscendingOrder ? 'Ascending' : 'Descending'})`);
            sortValueText.textContent = "По дате";
            this.sortMessagesByDate(this.isAscendingOrder);
        } else if (this.byMarksOption.checked) {
            console.log(`Sorting by rating... (${this.isAscendingOrder ? 'Ascending' : 'Descending'})`);
            sortValueText.textContent = "По количеству оценок";
            this.sortMessagesByRating(this.isAscendingOrder);
        } else if (this.byAnswersOption.checked) {
            console.log(`Sorting by replies... (${this.isAscendingOrder ? 'Ascending' : 'Descending'})`);
            sortValueText.textContent = "По количеству ответов";
            this.sortMessagesByReplies(this.isAscendingOrder);
        }

        this.sortArrow.style.transform = this.isAscendingOrder ? 'rotate(180deg)' : '';
    }

    public createNewMessage(text: string, avatarElement: HTMLImageElement, nameElement: HTMLParagraphElement, currentDateTime: string): Message {
        return new Message(
            Date.now(),
            avatarElement.src,
            nameElement.textContent ?? "Anonymous",
            text,
            currentDateTime
        );
    }

    public handleReplyMode(newMessage: Message): void {
        if (this.replyToMessageId === null) {
            console.error("ReplyToMessageId is null, cannot proceed.");
            return;
        }

        const parentContainer = document.querySelector(`.reply-container[data-id="${this.replyToMessageId}"]`) as HTMLElement;
        if (!parentContainer) {
            console.error("Parent container not found for reply.");
            return;
        }

        const messageAuthorName = this.getMessageAuthorName();
        this.addReply(this.replyToMessageId, newMessage);
        const replyElement = this.uiRenderer.createReplyElement(newMessage, messageAuthorName);
        parentContainer.appendChild(replyElement);
        console.log("Reply added:", newMessage);

        this.isReplyMode = false;
        this.replyToMessageId = null;
    }

    public handleNewMessage(newMessage: Message): void {
        const commentsContainerElement = document.querySelector(".article-bottom-comments__container") as HTMLElement;

        this.sendMessage(newMessage);
        const messageElement = this.uiRenderer.createMessageElement(newMessage);
        commentsContainerElement.appendChild(messageElement);
        console.log("Message sent:", newMessage);
    }

    private getMessageAuthorName(): string {
        const nameElement = document.querySelector('.text-container__name');
        if (!nameElement) return "";

        return Array.from(nameElement.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent ? node.textContent.trim() : "")
            .join("");
    }

    public resetTextArea(): void {
        this.textAreaElement.value = "";
        this.messageSizeElement.textContent = this.DEFAULT_TEXT;
        this.sendButtonElement.style.backgroundColor = "";
        this.textAreaElement.style.height = "auto";
        this.containerElement.style.height = "auto";
        this.errorMessageElement.style.visibility = "hidden";
    }

    public updateRandomUserMessage(): void {
        const avatarElement = document.getElementById("messageSendAvatar") as HTMLImageElement;
        const nameElement = document.getElementById("messageSendName") as HTMLParagraphElement;

        let userService = new UserService();
        const randomUser = userService.getRandomUser();
        avatarElement.src = randomUser.avatar;
        nameElement.textContent = randomUser.name;
    }
}
