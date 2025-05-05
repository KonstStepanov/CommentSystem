import {EventHandlers} from "./EventHandlers.js"
import {MessageService} from "./MessageService.js";

export class Message {
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

const textAreaElement = document.getElementById("autoTextArea") as HTMLTextAreaElement;
const sendButtonElement = document.getElementById("sendButton") as HTMLButtonElement;
const errorMessageElement = document.getElementById("errorMessage") as HTMLElement;
const messageSizeElement = document.getElementById("messageSize") as HTMLParagraphElement;
const containerElement = document.getElementById("autoTextBox") as HTMLElement;
const filterButton = document.getElementById("favButton") as HTMLElement;
const sortArrow = document.querySelector(".navigation-container__arrow") as HTMLElement;
const byDateOption = document.getElementById("option1") as HTMLInputElement;
const byMarksOption = document.getElementById("option2") as HTMLInputElement;
const byAnswersOption = document.getElementById("option3") as HTMLInputElement;
const DEFAULT_TEXT = "Макс. 1000 символов";

const messageService = new MessageService(
    DEFAULT_TEXT,
    sortArrow,
    byDateOption,
    byMarksOption,
    byAnswersOption,
    textAreaElement,
    messageSizeElement,
    sendButtonElement,
    containerElement,
    errorMessageElement
);
if (byMarksOption.checked) {
    messageService.applySortOrder();
}

const eventHandlers: EventHandlers = new EventHandlers();
eventHandlers.initMessageService(
    messageService,
    textAreaElement,
    sendButtonElement,
    errorMessageElement,
    messageSizeElement,
    containerElement,
    filterButton,
    sortArrow,
    byDateOption,
    byMarksOption,
    byAnswersOption,
    DEFAULT_TEXT)

