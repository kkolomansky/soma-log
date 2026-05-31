# Soma Log — Product Requirements Document

---

## 1. Kontekst

**Soma Log** to webowa aplikacja do śledzenia samopoczucia i regeneracji potreningowej w formie dzienniczka. Projekt jest na etapie koncepcji — nie ma jeszcze żadnego kodu ani infrastruktury. Zaczynamy od zera.

Celem jest stworzenie prostego narzędzia dla sportowców i osób aktywnych fizycznie, które chcą monitorować subiektywne odczucia po treningach: jakość snu, poziom regeneracji, ból mięśniowy (DOMS) i ogólne samopoczucie. Aplikacja ma służyć jako osobisty dziennik — nie jako platforma społecznościowa ani narzędzie diagnostyczne.

**Stan obecny:**
- Projekt: brak kodu
- Design: referencja wizualna (screenshot z aplikacji WHOOP — ciemny motyw, karty, kołowe wskaźniki)
- Stack: do ustalenia (sugestia: React + Tailwind CSS + localStorage lub lekkie backend API)

---

## 2. Co dokładnie ma robić aplikacja w pierwszej wersji

### Ogólna struktura

Aplikacja składa się z **trzech ekranów** i dolnej nawigacji między nimi.

---

### Ekran 1 — Dodaj wpis (`/add`)

Formularz do codziennego logowania samopoczucia. Zawiera:

**Cztery wskaźniki w skali 1–10** (suwak lub przyciski), każdy z ikoną i etykietą:

| Wskaźnik | Ikona | Etykieta |
|----------|-------|----------|
| Samopoczucie ogólne | 😊 / 🌡️ | Mood |
| Regeneracja potreningowa | ⚡ / 🔋 | Recovery |
| Jakość snu | 🌙 / 💤 | Sleep |
| Bolesność mięśniowa (DOMS) | 🦵 / 🔥 | DOMS |

Każdy wskaźnik wyświetlany jako **karta z kołowym wskaźnikiem postępu** (circular gauge) — nawiązanie do screenshotu referencyjnego. Kolor kółka zmienia się w zależności od wartości (np. zielony = dobry, żółty = średni, czerwony = zły). Skala DOMS jest odwrócona (1 = brak bólu = dobrze).

**Pole tekstowe** — opcjonalny komentarz autora (np. opis treningu, uwagi).

**Przycisk "Zapisz wpis"** — zapisuje wpis z aktualną datą i godziną.

---

### Ekran 2 — Lista wpisów (`/log`)

Widok listy wszystkich zapisanych wpisów, posortowanych od najnowszego. Każdy wpis na liście pokazuje:

- Data i godzina wpisu
- Cztery wartości wskaźników jako małe ikony z liczbą
- Fragment tekstu komentarza (jeśli istnieje)
- Możliwość kliknięcia w wpis, żeby zobaczyć szczegóły

---

### Ekran 3 — Historia / Trendy (`/trends`)

Widok historyczny ze **wykresem liniowym** pokazującym zmiany wartości w czasie. Inspiracja: środkowy ekran ze screenshotu (Recovery vs. Exertion chart).

- Przełącznik zakresu czasowego: **7 dni / 30 dni / 90 dni**
- Każdy wskaźnik jako osobna linia na wykresie (z kolorowym oznaczeniem)
- Możliwość włączania/wyłączania widoczności poszczególnych linii

---

### Design

- **Ciemny motyw** (dark mode) jako domyślny — tło bliskie czarnemu (#111 / #1a1a1a)
- **Karty** z zaokrąglonymi rogami i lekko jaśniejszym tłem
- **Kołowe wskaźniki postępu** (circular progress) dla każdego parametru
- **Typografia:** duże, białe cyfry, mniejsze etykiety w szarości
- **Kolory wskaźników:**
  - Żółty/złoty — Recovery
  - Niebieski/fioletowy — Sleep
  - Zielony — Mood
  - Pomarańczowy/czerwony — DOMS
- **Dolna nawigacja** z ikonami dla trzech ekranów

---

### Dane

W pierwszej wersji dane przechowywane lokalnie w przeglądarce (`localStorage`). Brak kont użytkowników, brak backendu.

---

## 3. Referencje

Referencja wizualna — aplikacja WHOOP (iOS):

![Soma Log Design Reference](./reference.png)

**Co z tego bierzemy:**
- Ciemne tło z kartami
- Kołowe wskaźniki (circular gauges) z wartością procentową / liczbową w środku
- Małe wykresy słupkowe pod każdą kartą (historia ostatnich dni)
- Wykres liniowy dla widoku trendów z legendą i przełącznikiem zakresu czasu
- Dolna nawigacja: Today / Trends / Journal
- Czytelna, biała typografia na ciemnym tle
- Zaokrąglone karty z umiarkowanym odstępem

---

## 4. Następne kroki

Planowane rozszerzenia po MVP:

1. **Synchronizacja danych** — backend (np. Supabase lub Firebase) + konto użytkownika, żeby dane nie były tylko lokalne
2. **Powiadomienia** — przypomnienie o codziennym wpisie (PWA push notifications)
3. **Eksport danych** — CSV lub PDF z historią wpisów
4. **Tagi treningowe** — możliwość oznaczenia rodzaju treningu (siłowy, cardio, dzień wolny) przy każdym wpisie
5. **Tygodniowe podsumowanie** — automatycznie generowany przegląd tygodnia z komentarzem (np. "Twoja regeneracja była najlepsza we wtorek")
6. **Korelacje** — wizualizacja zależności między wskaźnikami (np. sen vs. DOMS)
7. **Wersja mobilna / PWA** — instalowalna na telefonie jako aplikacja
