class Message {
    public id: number;
    public avatar: string;
    public username: string;
    public text: string;
    public dateTime: string;
    public rating: number;
    public replies: Message[];

    constructor(
        id: number,
        avatar: string,
        username: string,
        text: string,
        dateTime: string,
        rating: number = 0,
        replies: Message[] = []
    ) {
        this.id = id;
        this.avatar = avatar;
        this.username = username;
        this.text = text;
        this.dateTime = dateTime;
        this.rating = rating;
        this.replies = replies;
    }
}

class MessageService {
    private readonly messages: Message[] = [];
    private static readonly MESSAGES_KEY = "savedMessages";
    private static readonly TOTAL_COMMENTS_KEY = "totalComments";
    private static readonly FAVORITES_KEY = "favorites";
    private _isAscendingOrder: boolean = false;

    get isAscendingOrder(): boolean {
        return this._isAscendingOrder;
    }

    set isAscendingOrder(value: boolean) {
        this._isAscendingOrder = value;
    }

    constructor() {
        this.loadFromLocalStorage();
        this.loadFavoritesFromLocalStorage();
        this.initializeEventListeners();
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
        const replies = document.querySelectorAll(".reply-container__reply");

        replyContainers.forEach((container) => {
            const favoriteElement = container.querySelector(".navigation-favorite") as HTMLElement;

            if (favoriteElement) {
                const isParentFavorite = favoriteElement.textContent?.trim() === "В избранном";
                const hasFavoriteReplies = Array.from(
                    container.querySelectorAll(".reply-container__reply")
                ).some((reply) => {
                    const replyFavorite = reply.querySelector(".navigation-favorite") as HTMLElement;
                    return replyFavorite?.textContent?.trim() === "В избранном";
                });

                (container as HTMLElement).style.display = isParentFavorite || hasFavoriteReplies ? "" : "none";
            }
        });

        replies.forEach((reply) => {
            const replyFavorite = reply.querySelector(".navigation-favorite") as HTMLElement;
            if (replyFavorite) {
                const isFavorite = replyFavorite.textContent?.trim() === "В избранном";
                (reply as HTMLElement).style.display = isFavorite ? "" : "none";
            }
        });
    }

    public showAllMessages(): void {
        const allContainers = document.querySelectorAll(".reply-container, .reply-container__reply");
        allContainers.forEach((container) => {
            (container as HTMLElement).style.display = "";
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
        this.messages.forEach(msg => msg.replies.sort((a, b) =>
            ascending ? a.rating - b.rating : b.rating - a.rating));
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
            const messageElement = createMessageElement(message);

            message.replies.forEach(reply => {
                const nameElement = messageElement.querySelector('.text-container__name');
                let messageAuthorName = "";
                if (nameElement) {
                    messageAuthorName = Array.from(nameElement.childNodes)
                        .filter(node => node.nodeType === Node.TEXT_NODE)
                        .map(node => node.textContent ? node.textContent.trim() : "")
                        .join("");
                }

                const replyElement = createReplyElement(reply, messageAuthorName);
                messageElement.appendChild(replyElement);
            });

            commentsContainer.appendChild(messageElement);
        });

        this.updateFavoritesUI();
    }
}

const messageService = new MessageService();

const textAreaElement = document.getElementById("autoTextArea") as HTMLTextAreaElement;
const sendButtonElement = document.getElementById("sendButton") as HTMLButtonElement;
const errorMessageElement = document.getElementById("errorMessage") as HTMLElement;
const commentsContainerElement = document.querySelector(".article-bottom-comments__container") as HTMLElement;
const messageSizeElement = document.getElementById("messageSize") as HTMLParagraphElement;
const containerElement = document.getElementById("autoTextBox") as HTMLElement;

const MAX_LENGTH = 1000;
const DEFAULT_TEXT = "Макс. 1000 символов";

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
    const text = getTrimmedText();
    const avatarElement = document.getElementById("messageSendAvatar") as HTMLImageElement;
    const nameElement = document.getElementById("messageSendName") as HTMLParagraphElement;
    const currentDateTime = getCurrentDateTime();

    if (!isValidMessage(text)) {
        console.error(text.length > MAX_LENGTH ? "Message is too long." : "Message is empty.");
        return;
    }

    const newMessage = createNewMessage(text, avatarElement, nameElement, currentDateTime);

    if (messageService.isReplyMode && messageService.replyToMessageId !== null) {
        handleReplyMode(newMessage);
    } else {
        handleNewMessage(newMessage);
    }

    resetTextArea();
    updateRandomUserMessage();
});

// **Helper Functions**
function getTrimmedText(): string {
    return textAreaElement.value.trim();
}

function getCurrentDateTime(): string {
    return new Date().toLocaleString("ru-RU", {month: "numeric", day: "numeric", hour: "numeric", minute: "numeric"});
}

function isValidMessage(text: string): boolean {
    return text.length > 0 && text.length <= MAX_LENGTH;
}

function createNewMessage(text: string, avatarElement: HTMLImageElement, nameElement: HTMLParagraphElement, currentDateTime: string): Message {
    return new Message(
        Date.now(),
        avatarElement.src,
        nameElement.textContent ?? "Anonymous",
        text,
        currentDateTime
    );
}

function handleReplyMode(newMessage: Message): void {
    if (messageService.replyToMessageId === null) {
        console.error("ReplyToMessageId is null, cannot proceed.");
        return;
    }

    const parentContainer = document.querySelector(`.reply-container[data-id="${messageService.replyToMessageId}"]`) as HTMLElement;
    if (!parentContainer) {
        console.error("Parent container not found for reply.");
        return;
    }

    const messageAuthorName = getMessageAuthorName();
    messageService.addReply(messageService.replyToMessageId, newMessage);
    const replyElement = createReplyElement(newMessage, messageAuthorName);
    parentContainer.appendChild(replyElement);
    console.log("Reply added:", newMessage);

    messageService.isReplyMode = false;
    messageService.replyToMessageId = null;
}


function handleNewMessage(newMessage: Message): void {
    messageService.sendMessage(newMessage);
    const messageElement = createMessageElement(newMessage);
    commentsContainerElement.appendChild(messageElement);
    console.log("Message sent:", newMessage);
}

function getMessageAuthorName(): string {
    const nameElement = document.querySelector('.text-container__name');
    if (!nameElement) return "";

    return Array.from(nameElement.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent ? node.textContent.trim() : "")
        .join("");
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

function resetTextArea(): void {

    textAreaElement.value = "";
    messageSizeElement.textContent = DEFAULT_TEXT;
    sendButtonElement.style.backgroundColor = "";
    textAreaElement.style.height = "auto";
    containerElement.style.height = "auto";
    errorMessageElement.style.visibility = "hidden";
}

function createMessageElement(message: Message): HTMLElement {
    const messageElement = document.createElement("div");
    messageElement.className = "reply-container";
    messageElement.dataset.id = message.id.toString();

    // **Determine rating display color**
    let ratingColor = "black";
    if (message.rating > 0) {
        ratingColor = "green";
    } else if (message.rating < 0) {
        ratingColor = "red";
    }

    messageElement.innerHTML = `
        <div class="reply-container__message">
            <div class="message-box__avatar">
                <img src="${message.avatar}" alt="avatar" class="message-box__avatar_circle">
            </div>
            <div class="text-container__name">
                ${message.username}
                <p class="text-container__date-time">${message.dateTime}</p>
            </div>
            <div class="text-container">
                <div class="text-container__text">${message.text}</div>
                <nav class="text-container__navigation">
                    <img src="./assets/reply_icon.svg" alt="reply">
                    <p class="navigation-reply">Ответить</p>
                    <img class="navigation-fav-icon" src="./assets/favorite_icon_unchecked.svg" alt="favorite">
                    <p class="navigation-favorite">В избранное</p>
                    <div class="navigation-mark">
                        <img class="navigation-mark_button-pointer-minus" src="./assets/mark_minus.svg" alt="minus">
                        <p class="message-reply-message-text-mark-number" style="color: ${ratingColor}">${Math.abs(message.rating || 0)}</p>
                        <img class="navigation-mark_button-pointer-plus" src="./assets/mark_plus.svg" alt="plus">
                    </div>
                </nav>
            </div>
        </div>
    `;
    return messageElement;
}


function createReplyElement(reply: Message, senderName: any): HTMLElement {
    const replyElement = document.createElement("div");
    replyElement.className = "reply-container__reply";
    replyElement.dataset.id = reply.id.toString();

    // **Determine rating display color**
    let ratingColor = "black";
    if (reply.rating > 0) {
        ratingColor = "green";
    } else if (reply.rating < 0) {
        ratingColor = "red";
    }

    replyElement.innerHTML = `
        <div class="message-box__avatar">
            <img src="${reply.avatar}" alt="avatar" class="message-box__avatar_circle">
        </div>
        <div class="text-container__name-reply">
            ${reply.username}
            <img src="./assets/reply_icon.svg" alt="reply">
            <p class="message-reply-message-text-value">${senderName}</p>
            <p class="text-container__date-time">${reply.dateTime}</p>
        </div>
        <div class="reply-text">
            <div class="text-container__text">${reply.text}</div>
            <div class="text-container__navigation">
                <img class="navigation-fav-icon" src="./assets/favorite_icon_unchecked.svg" alt="favorite">
                <p class="navigation-favorite">В избранное</p>
                <div class="navigation-mark">
                    <img class="navigation-mark_button-pointer-minus" src="./assets/mark_minus.svg" alt="minus">
                    <p class="message-reply-message-text-mark-number" style="color: ${ratingColor}">${Math.abs(reply.rating || 0)}</p>
                    <img class="navigation-mark_button-pointer-plus" src="./assets/mark_plus.svg" alt="plus">
                </div>
            </div>
        </div>
    `;
    return replyElement;
}

function updateRandomUserMessage(): void {
    const avatarElement = document.getElementById("messageSendAvatar") as HTMLImageElement;
    const nameElement = document.getElementById("messageSendName") as HTMLParagraphElement;

    const randomUser = userService.getRandomUser();
    avatarElement.src = randomUser.avatar;
    nameElement.textContent = randomUser.name;
}

const filterButton = document.getElementById("favButton") as HTMLElement;

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

const byDateOption = document.getElementById("option1") as HTMLInputElement;
const byMarksOption = document.getElementById("option2") as HTMLInputElement;
const byAnswersOption = document.getElementById("option3") as HTMLInputElement;
const sortValueText = document.getElementById("sortValue") as HTMLElement;
const sortArrow = document.querySelector(".navigation-container__arrow") as HTMLElement;

function applySortOrder() {
    if (byDateOption.checked) {
        console.log(`Sorting by date... (${messageService.isAscendingOrder ? 'Ascending' : 'Descending'})`);
        sortValueText.textContent = "По дате";
        messageService.sortMessagesByDate(messageService.isAscendingOrder);
    } else if (byMarksOption.checked) {
        console.log(`Sorting by rating... (${messageService.isAscendingOrder ? 'Ascending' : 'Descending'})`);
        sortValueText.textContent = "По количеству оценок";
        messageService.sortMessagesByRating(messageService.isAscendingOrder);
    } else if (byAnswersOption.checked) {
        console.log(`Sorting by replies... (${messageService.isAscendingOrder ? 'Ascending' : 'Descending'})`);
        sortValueText.textContent = "По количеству ответов";
        messageService.sortMessagesByReplies(messageService.isAscendingOrder);
    }

    sortArrow.style.transform = messageService.isAscendingOrder ? 'rotate(180deg)' : '';
}

sortArrow.addEventListener("click", () => {
    messageService.isAscendingOrder = !messageService.isAscendingOrder;
    console.log(`Sort order changed to: ${messageService.isAscendingOrder ? 'Ascending' : 'Descending'}`);
    applySortOrder();
});

byDateOption.addEventListener("change", () => {
    if (byDateOption.checked) {
        applySortOrder();
    }
});

byMarksOption.addEventListener("change", () => {
    if (byMarksOption.checked) {
        applySortOrder();
    }
});

byAnswersOption.addEventListener("change", () => {
    if (byAnswersOption.checked) {
        applySortOrder();
    }
});

if (byMarksOption.checked) {
    applySortOrder();
}