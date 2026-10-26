import { Routes } from '@angular/router'
import { AboutPageComponent } from '@/pages/about.page'
import { CartPageComponent } from '@/pages/cart.page'
import { CatalogPageComponent } from '@/pages/catalog.page'
import { HomePageComponent } from '@/pages/home.page'
import { NotFoundPageComponent } from '@/pages/not-found.page'
import { ProfilePageComponent } from '@/pages/profile.page'

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', component: HomePageComponent, title: 'Главная - FEOD Shop' },
  { path: 'catalog', component: CatalogPageComponent, title: 'Каталог - FEOD Shop' },
  { path: 'cart', component: CartPageComponent, title: 'Корзина - FEOD Shop' },
  { path: 'profile', component: ProfilePageComponent, title: 'Профиль - FEOD Shop' },
  { path: 'about', component: AboutPageComponent, title: 'О проекте - FEOD Shop' },
  { path: '**', component: NotFoundPageComponent, title: 'Страница не найдена - FEOD Shop' },
]
