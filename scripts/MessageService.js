import { Message } from "./Message.js";
import { UserService } from "./User.js";
import { UIRenderer } from "./UIRenderer.js";
export class MessageService {
    messages = [];
    static MESSAGES_KEY = "savedMessages";
    static TOTAL_COMMENTS_KEY = "totalComments";
    static FAVORITES_KEY = "favorites";
    _isAscendingOrder = false;
    uiRenderer = new UIRenderer();
    DEFAULT_TEXT;
    sortArrow;
    byDateOption;
    byMarksOption;
    byAnswersOption;
    textAreaElement;
    messageSizeElement;
    sendButtonElement;
    containerElement;
    errorMessageElement;
    constructor(/* NOSONAR */ DEFAULT_TEXT, sortArrow, byDateOption, byMarksOption, byAnswersOption, textAreaElement, messageSizeElement, sendButtonElement, containerElement, errorMessageElement) {
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
    get isAscendingOrder() {
        return this._isAscendingOrder;
    }
    set isAscendingOrder(value) {
        this._isAscendingOrder = value;
    }
    loadFromLocalStorage() {
        const savedMessages = localStorage.getItem(MessageService.MESSAGES_KEY);
        if (savedMessages) {
            try {
                const parsedMessages = JSON.parse(savedMessages);
                this.messages.length = 0;
                parsedMessages.forEach((msgData) => {
                    const message = new Message(msgData.id, msgData.avatar, msgData.username, msgData.text, msgData.dateTime, msgData.rating);
                    if (msgData.replies && Array.isArray(msgData.replies)) {
                        message.replies = msgData.replies.map((replyData) => new Message(replyData.id, replyData.avatar, replyData.username, replyData.text, replyData.dateTime, replyData.rating));
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
            }
            catch (error) {
                console.error("Error loading messages from localStorage:", error);
            }
        }
    }
    loadFavoritesFromLocalStorage() {
        const savedFavorites = localStorage.getItem(MessageService.FAVORITES_KEY);
        if (savedFavorites) {
            try {
                const favoriteIds = JSON.parse(savedFavorites);
                this.favorites = new Set(favoriteIds);
                console.log(`Loaded ${this.favorites.size} favorites from localStorage`);
            }
            catch (error) {
                console.error("Error loading favorites from localStorage:", error);
            }
        }
    }
    updateFavoritesUI() {
        this.favorites.forEach(id => {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                const favoriteIcon = element.querySelector(".navigation-favorite");
                const favoriteImg = element.querySelector(".navigation-fav-icon");
                if (favoriteIcon && favoriteImg) {
                    favoriteIcon.textContent = "В избранном";
                    favoriteImg.src = "./assets/favorite_icon.svg";
                }
            }
        });
    }
    isReplyMode = false;
    replyToMessageId = null;
    favorites = new Set();
    sendMessage(message) {
        if (this.isReplyMode && this.replyToMessageId !== null) {
            const parentMessage = this.messages.find((msg) => msg.id === this.replyToMessageId);
            if (parentMessage) {
                parentMessage.replies.push(message);
                console.log(`Reply added to message ID: ${this.replyToMessageId}`);
            }
            else {
                console.error(`Parent message with ID ${this.replyToMessageId} not found.`);
            }
            this.isReplyMode = false;
            this.replyToMessageId = null;
        }
        else {
            this.messages.push(message);
            const totalComments = this.updateCommentCount();
            this.saveToLocalStorage(totalComments);
        }
    }
    enableReplyMode(parentMessageId) {
        this.isReplyMode = true;
        this.replyToMessageId = parentMessageId;
        console.log(`Reply mode enabled for message ID: ${parentMessageId}`);
    }
    addReply(parentMessageId, reply) {
        const parentMessage = this.messages.find((message) => message.id === parentMessageId);
        if (!parentMessage) {
            console.error(`Message with ID ${parentMessageId} not found. Cannot add reply.`);
            return;
        }
        parentMessage.replies.push(reply);
        this.saveToLocalStorage();
    }
    saveToLocalStorage(totalComments) {
        localStorage.setItem(MessageService.MESSAGES_KEY, JSON.stringify(this.messages));
        if (totalComments !== undefined) {
            localStorage.setItem(MessageService.TOTAL_COMMENTS_KEY, totalComments.toString());
        }
    }
    updateCommentCount() {
        const commentsNumberElement = document.getElementById("commentsNumber");
        const totalComments = (parseInt(commentsNumberElement?.textContent?.replace(/[()]/g, "") ?? "0", 10) + 1) || 0;
        if (commentsNumberElement) {
            commentsNumberElement.textContent = `(${totalComments})`;
        }
        return totalComments;
    }
    toggleFavorite(id) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (!element) {
            console.error(`Element with ID ${id} not found in the DOM.`);
            return;
        }
        console.log("Element Found:", element);
        const favoriteIcon = element.querySelector(".navigation-favorite");
        const favoriteImg = element.querySelector(".navigation-fav-icon");
        if (!favoriteIcon || !favoriteImg) {
            console.error(`Favorite UI elements not found for ID: ${id}`);
            return;
        }
        if (this.favorites.has(id)) {
            this.favorites.delete(id);
            favoriteIcon.textContent = "В избранное";
            favoriteImg.src = "./assets/favorite_icon_unchecked.svg";
            console.log(`Removed from favorites: ${id}`);
        }
        else {
            this.favorites.add(id);
            favoriteIcon.textContent = "В избранном";
            favoriteImg.src = "./assets/favorite_icon.svg";
            console.log(`Added to favorites: ${id}`);
        }
        this.saveFavoritesToLocalStorage();
    }
    filterFavorites() {
        const replyContainers = document.querySelectorAll(".reply-container");
        replyContainers.forEach((container) => {
            const favoriteElement = container.querySelector(".navigation-favorite");
            const messageContent = container.querySelector(".reply-container__message");
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
                const replyFavorite = reply.querySelector(".navigation-favorite");
                if (replyFavorite) {
                    const isReplyFavorite = replyFavorite.textContent?.trim() === "В избранном";
                    // Show/hide reply based on its favorite status
                    reply.style.display = isReplyFavorite ? "" : "none";
                    // Track if we have any visible replies
                    if (isReplyFavorite) {
                        hasVisibleReplies = true;
                    }
                }
            });
            // Show parent container only if:
            // 1. The parent message itself is favorited, or
            // 2. It contains at least one favorited reply
            container.style.display = (isParentFavorite || hasVisibleReplies) ? "" : "none";
        });
    }
    showAllMessages() {
        // Show all containers and replies
        const allContainers = document.querySelectorAll(".reply-container, .reply-container__reply");
        allContainers.forEach((container) => {
            container.style.display = "";
        });
        // Also make sure all message content elements are visible
        const allMessageContents = document.querySelectorAll(".reply-container__message");
        allMessageContents.forEach((content) => {
            content.style.display = "";
        });
    }
    saveFavoritesToLocalStorage() {
        localStorage.setItem(MessageService.FAVORITES_KEY, JSON.stringify(Array.from(this.favorites)));
    }
    initializeEventListeners() {
        document.addEventListener("click", (event) => {
            const target = event.target;
            if (target.classList.contains("navigation-mark_button-pointer-plus")) {
                this.updateMessageRating(target, 1);
            }
            else if (target.classList.contains("navigation-mark_button-pointer-minus")) {
                this.updateMessageRating(target, -1);
            }
        });
    }
    updateMessageRating(target, value) {
        const parentContainer = target.closest(".reply-container, .reply-container__reply");
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
        const ratingElement = parentContainer.querySelector(".message-reply-message-text-mark-number");
        if (ratingElement) {
            const displayRating = Math.abs(message.rating);
            ratingElement.textContent = displayRating.toString();
            let color = "black"; // Default color
            if (message.rating > 0) {
                color = "green";
            }
            else if (message.rating < 0) {
                color = "red";
            }
            ratingElement.style.color = color;
        }
        else {
            console.error("Rating display element not found!");
        }
        this.saveToLocalStorage();
    }
    findMessageById(id) {
        return this.messages.find(msg => msg.id === id) ||
            this.messages.reduce((acc, msg) => acc.concat(msg.replies), []).find(reply => reply.id === id);
    }
    sortMessagesByRating(ascending = false) {
        this.messages.sort((a, b) => ascending ? a.rating - b.rating : b.rating - a.rating);
        this.messages.forEach(msg => {
            msg.replies = msg.replies.toSorted((a, b) => ascending ? a.rating - b.rating : b.rating - a.rating);
        });
        console.log("Messages sorted by rating:", ascending ? "Ascending" : "Descending");
        this.refreshUI();
    }
    parseDate(dateString) {
        return new Date(dateString.split('.').reverse().join('-')).getTime();
    }
    sortMessagesByDate(ascending = false) {
        this.messages.sort((a, b) => ascending ? this.parseDate(a.dateTime) -
            this.parseDate(b.dateTime) : this.parseDate(b.dateTime) - this.parseDate(a.dateTime));
        this.messages.forEach(msg => {
            msg.replies.sort((a, b) => ascending ? this.parseDate(a.dateTime) -
                this.parseDate(b.dateTime) : this.parseDate(b.dateTime) - this.parseDate(a.dateTime));
        });
        console.log("Messages sorted by date:", ascending ? "Ascending" : "Descending");
        this.refreshUI();
    }
    sortMessagesByReplies(ascending = false) {
        this.messages.sort((a, b) => ascending ? a.replies.length - b.replies.length : b.replies.length - a.replies.length);
        console.log("Messages sorted by number of replies:", ascending ? "Ascending" : "Descending");
        this.refreshUI();
    }
    refreshUI() {
        const commentsContainer = document.querySelector(".article-bottom-comments__container");
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
    applySortOrder() {
        const sortValueText = document.getElementById("sortValue");
        if (this.byDateOption.checked) {
            console.log(`Sorting by date... (${this.isAscendingOrder ? 'Ascending' : 'Descending'})`);
            sortValueText.textContent = "По дате";
            this.sortMessagesByDate(this.isAscendingOrder);
        }
        else if (this.byMarksOption.checked) {
            console.log(`Sorting by rating... (${this.isAscendingOrder ? 'Ascending' : 'Descending'})`);
            sortValueText.textContent = "По количеству оценок";
            this.sortMessagesByRating(this.isAscendingOrder);
        }
        else if (this.byAnswersOption.checked) {
            console.log(`Sorting by replies... (${this.isAscendingOrder ? 'Ascending' : 'Descending'})`);
            sortValueText.textContent = "По количеству ответов";
            this.sortMessagesByReplies(this.isAscendingOrder);
        }
        this.sortArrow.style.transform = this.isAscendingOrder ? 'rotate(180deg)' : '';
    }
    createNewMessage(text, avatarElement, nameElement, currentDateTime) {
        return new Message(Date.now(), avatarElement.src, nameElement.textContent ?? "Anonymous", text, currentDateTime);
    }
    handleReplyMode(newMessage) {
        if (this.replyToMessageId === null) {
            console.error("ReplyToMessageId is null, cannot proceed.");
            return;
        }
        const parentContainer = document.querySelector(`.reply-container[data-id="${this.replyToMessageId}"]`);
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
    handleNewMessage(newMessage) {
        const commentsContainerElement = document.querySelector(".article-bottom-comments__container");
        this.sendMessage(newMessage);
        const messageElement = this.uiRenderer.createMessageElement(newMessage);
        commentsContainerElement.appendChild(messageElement);
        console.log("Message sent:", newMessage);
    }
    getMessageAuthorName() {
        const nameElement = document.querySelector('.text-container__name');
        if (!nameElement)
            return "";
        return Array.from(nameElement.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent ? node.textContent.trim() : "")
            .join("");
    }
    resetTextArea() {
        this.textAreaElement.value = "";
        this.messageSizeElement.textContent = this.DEFAULT_TEXT;
        this.sendButtonElement.style.backgroundColor = "";
        this.textAreaElement.style.height = "auto";
        this.containerElement.style.height = "auto";
        this.errorMessageElement.style.visibility = "hidden";
    }
    updateRandomUserMessage() {
        const avatarElement = document.getElementById("messageSendAvatar");
        const nameElement = document.getElementById("messageSendName");
        let userService = new UserService();
        const randomUser = userService.getRandomUser();
        avatarElement.src = randomUser.avatar;
        nameElement.textContent = randomUser.name;
    }
}
