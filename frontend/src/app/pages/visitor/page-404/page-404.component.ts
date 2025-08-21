import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from "../../../components/visitor/navbar/navbar.component";
import { FooterComponent } from "../../../components/visitor/footer/footer.component";

@Component({
  selector: 'app-page-404',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './page-404.component.html',
  styleUrl: './page-404.component.css'
})
export class Page404Component {

}
