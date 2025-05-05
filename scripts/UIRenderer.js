export class UIRenderer {
    createMessageElement(message) {
        const messageElement = document.createElement("div");
        messageElement.className = "reply-container";
        messageElement.dataset.id = message.id.toString();
        let ratingColor = "black";
        if (message.rating > 0) {
            ratingColor = "green";
        }
        else if (message.rating < 0) {
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
    createReplyElement(reply, senderName) {
        const replyElement = document.createElement("div");
        replyElement.className = "reply-container__reply";
        replyElement.dataset.id = reply.id.toString();
        // **Determine rating display color**
        let ratingColor = "black";
        if (reply.rating > 0) {
            ratingColor = "green";
        }
        else if (reply.rating < 0) {
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
}
