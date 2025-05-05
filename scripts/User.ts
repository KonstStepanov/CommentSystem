class User {
    public name: string;
    public avatar: string;

    constructor(name: string, avatar: string) {
        this.name = name;
        this.avatar = avatar;
    }
}

export class UserService {
    private readonly url: string = "https://randomuser.me/api/?results=20";
    private users: User[] = [
        {name: "Lilja Suomi", avatar: "./assets/avatars/68.jpg"},
        {name: "Nella Niskanen", avatar: "./assets/avatars/86.jpg"},
        {name: "Sofus Steinsland", avatar: "./assets/avatars/15.jpg"},
        {name: "Consuelo Castro", avatar: "./assets/avatars/25.jpg"},
        {name: "Cory Parker", avatar: "./assets/avatars/98.jpg"},
        {name: "Christoffer Mortensen", avatar: "./assets/avatars/2.jpg"},
        {name: "Porfirio Urías", avatar: "./assets/avatars/87.jpg"},
        {name: "Arlo Li", avatar: "./assets/avatars/97.jpg"},
        {name: "Daniela Guillaume", avatar: "./assets/avatars/33.jpg"},
        {name: "Urbano da Rocha", avatar: "./assets/avatars/75.jpg"},
        {name: "Yeni Molina", avatar: "./assets/avatars/45.jpg"},
        {name: "Tejas Mendonsa", avatar: "./assets/avatars/73.jpg"},
        {name: "Nevaeh Jackson", avatar: "./assets/avatars/66.jpg"},
        {name: "Leposava Rađen", avatar: "./assets/avatars/8.jpg"},
        {name: "Emma Martin", avatar: "./assets/avatars/46.jpg"},
        {name: "Carla Rochen", avatar: "./assets/avatars/35.jpg"},
        {name: "Denian Van Gemerden", avatar: "./assets/avatars/14.jpg"},
        {name: "Livia Mossige", avatar: "./assets/avatars/47.jpg"},
        {name: "Silvija Novak", avatar: "./assets/avatars/67.jpg"},
        {name: "Mathias Mortensen", avatar: "./assets/avatars/74.jpg"}
    ];

    public async fetchUsersFromAPI(): Promise<void> {
        try {
            const response = await fetch(this.url);
            const data = await response.json();
            this.users = data.results.map(
                (item: any) => new User(`${item.name.first} ${item.name.last}`, item.picture.medium)
            );
            console.log("API call successful. User array updated.");
        } catch (error) {
            console.error("Error fetching data from API. Retaining default user list.", error);
        }
    }

    public getRandomUser(): User {
        const randomIndex = Math.floor(Math.random() * this.users.length);
        return this.users[randomIndex];
    }
}

const userService = new UserService();

const avatarElement = document.getElementById("messageSendAvatar") as HTMLImageElement;
const nameElement = document.getElementById("messageSendName") as HTMLParagraphElement;

function updateRandomUser(): void {
    const randomUser = userService.getRandomUser();
    avatarElement.src = randomUser.avatar;
    nameElement.textContent = randomUser.name;
}

window.addEventListener("load", async () => {
    updateRandomUser();
    await userService.fetchUsersFromAPI();
});