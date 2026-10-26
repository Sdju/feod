// [comment:"Legacy использует новый модуль"]
// @[check] Публичный API нового User доступен legacy-слою.
import { userState } from '../../modules/User';
// @[warn] Слой legacy свободен внутри, но не может читать приватные файлы User.
import * as privateUser from '../../modules/User/model';
// @[check] Связи legacy → legacy разрешены без требования публичных entry.
import { oldStore } from '../old-store';

export const profile = () => ({ ...oldStore, name: userState.name });
