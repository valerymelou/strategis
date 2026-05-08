import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  template: `
    <div class="flex w-full max-w-[430px] flex-col">
      <h1
        class="font-serif text-[36px] leading-[56px] tracking-[0.288px]"
        i18n="@@register.title"
      >
        Create your account
      </h1>
      <p
        class="text-muted-foreground mt-4 text-xs tracking-[0.096px]"
        i18n="@@register.login.text"
      >
        Already have an account?
        <a
          routerLink="/auth/login"
          class="text-foreground ml-1 underline underline-offset-2"
          >Sign in</a
        >
      </p>
    </div>
  `,
})
export class Register {}
