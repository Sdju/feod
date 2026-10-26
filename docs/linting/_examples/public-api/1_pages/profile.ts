// [comment:"Сравните два пути импорта"]
// @[warn] Прямой доступ к model.ts нарушает границу User. Исправление показано строкой ниже.
import * as privateUser from '@modules/User/model';
// @[check] Импорт проходит через index.ts: внутренний файл остаётся закрытым.
import { userState } from '@modules/User';

export const profileName = userState.name;
