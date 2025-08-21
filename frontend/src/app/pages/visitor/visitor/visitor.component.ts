import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from "../../../components/visitor/footer/footer.component";
import { NavbarComponent } from "../../../components/visitor/navbar/navbar.component";

@Component({
  selector: 'app-visitor',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, NavbarComponent],
  templateUrl: './visitor.component.html',
  styleUrl: './visitor.component.css'
})
export class VisitorComponent {

}
