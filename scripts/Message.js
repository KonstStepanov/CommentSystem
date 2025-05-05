import { EventHandlers } from "./EventHandlers.js";
import { MessageService } from "./MessageService.js";
export class Message {
    id;
    avatar;
    username;
    text;
    dateTime;
    rating;
    replies;
    constructor(id, avatar, username, text, dateTime, rating = 0, replies = []) {
        this.id = id;
        this.avatar = avatar;
        this.username = username;
        this.text = text;
        this.dateTime = dateTime;
        this.rating = rating;
        this.replies = replies;
    }
}
const textAreaElement = document.getElementById("autoTextArea");
const sendButtonElement = document.getElementById("sendButton");
const errorMessageElement = document.getElementById("errorMessage");
const messageSizeElement = document.getElementById("messageSize");
const containerElement = document.getElementById("autoTextBox");
const filterButton = document.getElementById("favButton");
const sortArrow = document.querySelector(".navigation-container__arrow");
const byDateOption = document.getElementById("option1");
const byMarksOption = document.getElementById("option2");
const byAnswersOption = document.getElementById("option3");
const DEFAULT_TEXT = "Макс. 1000 символов";
const messageService = new MessageService(DEFAULT_TEXT, sortArrow, byDateOption, byMarksOption, byAnswersOption, textAreaElement, messageSizeElement, sendButtonElement, containerElement, errorMessageElement);
if (byMarksOption.checked) {
    messageService.applySortOrder();
}
const eventHandlers = new EventHandlers();
eventHandlers.initMessageService(messageService, textAreaElement, sendButtonElement, errorMessageElement, messageSizeElement, containerElement, filterButton, sortArrow, byDateOption, byMarksOption, byAnswersOption, DEFAULT_TEXT);
