import { action, observable, makeObservable, computed } from "mobx";

class GlobalModel {
  constructor() {
    makeObservable(this);
  }

  @observable id = undefined;
  @observable avatar = undefined;
  @observable firstName = undefined;
  @observable secondName = undefined;
  @observable authorized = undefined;
  @observable email = undefined;
  @observable ws: WebSocket = undefined;

  @action
  setAuthorized(authorized) {
    this.authorized = authorized;
  }

  @action
  setId(id) {
    this.id = id;
  }

  @action
  setAvatar(avatar) {
    this.avatar = avatar;
  }

  @action
  setFirstName(firstName) {
    this.firstName = firstName;
  }

  @action
  setSecondName(secondName) {
    this.secondName = secondName;
  }

  @action
  setEmail(email) {
    this.email = email;
  }

  @action
  setWs(ws) {
    this.ws = ws;
  }

  @computed
  get getFullName() {
    return `${this.secondName} ${this.firstName}`.trim();
  }
}

const GlobalStore = new GlobalModel();
export default GlobalStore;
