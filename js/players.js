/**
 * =========================
 * PLAYERS MODULE
 * =========================
 * Ansvar:
 * - Lista över spelare
 * - Används för autocomplete
 * - Ingen UI-logik här
 */

export const players = [
  // ALGERIET
  { name: "Rayan Ait-Nouri", country: "Algeriet" },
  { name: "Adil Boulbina", country: "Algeriet" },
  { name: "Mohamed El Amine Amoura", country: "Algeriet" },
  { name: "Amine Gouiri", country: "Algeriet" },
  
    // ARGENTINA
  { name: "Lionel Messi", country: "Argentina" },
  { name: "Lautaro Martínez", country: "Argentina" },
  { name: "Julián Álvarez", country: "Argentina" },
  { name: "Enzo Fernández", country: "Argentina" },
  { name: "Rodrigo De Paul", country: "Argentina" },

  // AUSTRALIEN
  { name: "Martin Boyle", country: "Australien" },
  { name: "Connor Metcalfe", country: "Australien" },

  // BELGIEN
  { name: "Kevin De Bruyne", country: "Belgien" },
  { name: "Romelu Lukaku", country: "Belgien" },
  { name: "Jérémy Doku", country: "Belgien" },
  { name: "Leandro Trossard", country: "Belgien" },
  { name: "Amadou Onana", country: "Belgien" },

  // BOSNIEN AND HERCEGOVINA
  { name: "Edin Dzeko", country: "Bosnien och Hercegovina" },

  // BRASILIEN
  { name: "Vinícius Júnior", country: "Brasilien" },
  { name: "Rodrygo", country: "Brasilien" },
  { name: "Neymar Jr", country: "Brasilien" },
  { name: "Bruno Guimarães", country: "Brasilien" },
  { name: "Gabriel Jesus", country: "Brasilien" },
  { name: "Raphinha", country: "Brasilien" },
  { name: "Igor Thiago", country: "Brasilien" },
  { name: "Matheus Cunha", country: "Brasilien" },
  { name: "Gabriel Martinelli", country: "Brasilien" },

  // COLOMBIA
  { name: "Luis Diaz", country: "Colombia" },

  // DANMARK
  { name: "Rasmus Højlund", country: "Danmark" },
  { name: "Christian Eriksen", country: "Danmark" },
  { name: "Mikkel Damsgaard", country: "Danmark" },

  // ECUADOR
  { name: "Enner Valencia", country: "Ecuador" },

  // EGYPTEN
  { name: "Mohamed Salah", country: "Egypten" },

  // ENGLAND
  { name: "Harry Kane", country: "England" },
  { name: "Jude Bellingham", country: "England" },
  { name: "Bukayo Saka", country: "England" },
  { name: "Phil Foden", country: "England" },
  { name: "Declan Rice", country: "England" },
  { name: "Cole Palmer", country: "England" },
  { name: "Marcus Rashford", country: "England" },
  { name: "Eberechi Eze", country: "England" },

  // FRANKRIKE
  { name: "Kylian Mbappé", country: "Frankrike" },
  { name: "Antoine Griezmann", country: "Frankrike" },
  { name: "Ousmane Dembélé", country: "Frankrike" },
  { name: "Aurélien Tchouaméni", country: "Frankrike" },
  { name: "Eduardo Camavinga", country: "Frankrike" },
  { name: "Michael Olise", country: "Frankrike" },
  { name: "Desire Doue", country: "Frankrike" },
  { name: "Marcus Thuram", country: "Frankrike" },
  { name: "Jean-Philippe Mateta", country: "Frankrike" },

  // GHANA
  { name: "Antoine Semenyo", country: "Ghana" },

  // HAITI
  { name: "Duckens Nazon", country: "Haiti" },
  { name: "Wilson Isidor", country: "Haiti" },
  { name: "Jean-Ricner Bellegarde", country: "Haiti" },

  // IRAN
  { name: "Mehdi Taremi", country: "Iran" },
  { name: "Mehdi Ghaedi", country: "Iran" },

  // IRAK
  { name: "Aymen Hussein", country: "Irak" },
  { name: "Mohanad Ali", country: "Irak" },
  { name: "Amir Al-Ammari", country: "Irak" },

  // JAPAN
  { name: "Takefusa Kubo", country: "Japan" },
  { name: "Daichi Kamada", country: "Japan" },
  { name: "Ritsu Doan", country: "Japan" },
  { name: "Kaoru Mitoma", country: "Japan" },

  // KANADA
  { name: "Promise Akinpelu", country: "Kanada" },

  // KROATIEN
  { name: "Luka Modrić", country: "Kroatien" },
  { name: "Andrej Kramarić", country: "Kroatien" },
  { name: "Joško Gvardiol", country: "Kroatien" },
  { name: "Mario Pašalić", country: "Kroatien" },

  // MAROCKO
  { name: "Achraf Hakimi", country: "Marocko" },
  { name: "Hakim Ziyech", country: "Marocko" },
  { name: "Youssef En-Nesyri", country: "Marocko" },
  { name: "Sofyan Amrabat", country: "Marocko" },

  // MEXIKO
  { name: "Raul Jimenez", country: "Mexiko" },
  { name: "Armando Gonzalez", country: "Mexiko" },

  // NEDERLÄNDERNA
  { name: "Virgil van Dijk", country: "Nederländerna" },
  { name: "Xavi Simons", country: "Nederländerna" },
  { name: "Cody Gakpo", country: "Nederländerna" },
  { name: "Memphis Depay", country: "Nederländerna" },
  { name: "Frenkie de Jong", country: "Nederländerna" },
  { name: "Donyell Malen", country: "Nederländerna" },

  // NORGE
  { name: "Erling Haaland", country: "Norge" },
  { name: "Martin Ødegaard", country: "Norge" },
  { name: "Alexander Sorloth", country: "Norge" },

  // NYA ZEELAND
  { name: "Chris Wood", country: "Nya Zeeland" },

  // PANAMA
  { name: "Ismael Díaz", country: "Panama" },
  
  // PARAGUAY
  { name: "Antonio Sanabria", country: "Paraguay" },

  // PORTUGAL
  { name: "Cristiano Ronaldo", country: "Portugal" },
  { name: "Bruno Fernandes", country: "Portugal" },
  { name: "Bernardo Silva", country: "Portugal" },
  { name: "Rafael Leão", country: "Portugal" },
  { name: "João Félix", country: "Portugal" },
  { name: "Goncalo Ramos", country: "Portugal" },

  // QATAR
  { name: "Almoez Ali", country: "Qatar" },
  { name: "Akram Afif", country: "Qatar" },
  { name: "Hassan Al-Haydos", country: "Qatar" },

  // SAUDIARABIEN
  { name: "Salem Al-Dawsari", country: "Saudiarabien" },
  { name: "Sami Al-Jaber", country: "Saudiarabien" },

  // SCHWEIZ
  { name: "Granit Xhaka", country: "Schweiz" },
  { name: "Breel Embolo", country: "Schweiz" },
  { name: "Ruben Vargas", country: "Schweiz" },

  // SENEGAL
  { name: "Sadio Mane", country: "Senegal" },
  { name: "Nicolas Jackson", country: "Senegal" },

  // SKOTTLAND
  { name: "Lawrence Shankland", country: "Skottland" },
  
  // SPANIEN
  { name: "Pedri", country: "Spanien" },
  { name: "Gavi", country: "Spanien" },
  { name: "Lamine Yamal", country: "Spanien" },
  { name: "Álvaro Morata", country: "Spanien" },
  { name: "Dani Olmo", country: "Spanien" },
  { name: "Mikel Oyarzabal", country: "Spanien" },
  { name: "Mikel Merino", country: "Spanien" },
  { name: "Ferran Torres", country: "Spanien" },
  { name: "Nico Williams", country: "Spanien" },

  // SVERIGE
  { name: "Alexander Isak", country: "Sverige" },
  { name: "Dejan Kulusevski", country: "Sverige" },
  { name: "Viktor Gyökeres", country: "Sverige" },

  // SYDAFRIKA
  { name: "Lyle Foster", country: "Sydafrika" },

  // SYDKOREA
  { name: "Son Heung-min", country: "Sydkorea" },
  { name: "Lee Kang-in", country: "Sydkorea" },
  { name: "Hwang Hee-chan", country: "Sydkorea" },

  // TJECKIEN
  { name: "Patrik Schick", country: "Tjeckien" },

  // TURKIET
  { name: "Arda Güler", country: "Turkiet" },
  { name: "Kenan Yildiz", country: "Turkiet" },
  { name: "Hakan Çalhanoğlu", country: "Turkiet" },

  // TYSKLAND
  { name: "Jamal Musiala", country: "Tyskland" },
  { name: "Kai Havertz", country: "Tyskland" },
  { name: "Florian Wirtz", country: "Tyskland" },
  { name: "Joshua Kimmich", country: "Tyskland" },
  { name: "Niclas Füllkrug", country: "Tyskland" },
  { name: "Nick Woltemade", country: "Tyskland" },
  { name: "Deniz Undav", country: "Tyskland" },
  { name: "Maximilian Beier", country: "Tyskland" },

  // URUGUAY
  { name: "Federico Valverde", country: "Uruguay" },
  { name: "Darwin Núñez", country: "Uruguay" },
  { name: "Ronald Araújo", country: "Uruguay" },

  // USA
  { name: "Christian Pulisic", country: "USA" },
  { name: "Weston McKennie", country: "USA" },
  { name: "Giovanni Reyna", country: "USA" },
  { name: "Tim Weah", country: "USA" },
  { name: "Folarin Balogun", country: "USA" },

  // ÖSTERRIKE
  { name: "Michael Gregoritsch", country: "Österrike" },
  
];