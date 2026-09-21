# Lunchkollen – GitHub Pages

Färdig webbplats för **lunch.cloudidentity.se** med menyer och lunchpriser från sju restauranger i Linköping.
Menyer och priser hämtas av GitHub Actions varje timme kl. 01.17–10.17 på måndagar i tidszonen Europe/Stockholm.
Webbplatsen behöver ingen server, API-nyckel eller inloggning för besökarna.

## 1. Lägg koden i GitHub

1. Packa upp `lunchkollen-github.zip`.
2. Skapa ett **publikt** repository, exempelvis `lunchkollen`, på ditt GitHub-konto. GitHub Free stöder Pages för publika repositoryn.
3. Lägg upp allt i paketets rot på standardgrenen **main**. Mappen `.github` måste följa med; den innehåller automatiseringen. GitHub Desktop är ett alternativ om webbläsarens filuppladdning missar dolda mappar. Lägg inte hela paketet i en extra undermapp i repositoryt.
4. Kontrollera att filen `.github/workflows/lunch-pages.yml` syns på GitHub.

## 2. Aktivera Pages

1. Öppna repositoryts **Settings → Pages**.
2. Under **Build and deployment → Source**, välj **GitHub Actions**.
3. Under **Settings → Actions → General**, tillåt GitHub Actions. Arbetsflödet behöver kunna skriva menydata till `main`; om organisationens regler eller grenskydd blockerar detta behöver dessa anpassas för arbetsflödet.
4. Öppna **Actions → Uppdatera lunchmenyer och publicera → Run workflow** och kör på `main`.
5. Vänta tills körningen är grön. Sidans adress finns i körningens deployment och under Settings → Pages.

Den första automatiska körningen kan misslyckas om Pages ännu inte är aktiverat. Kör den manuellt igen efter steg 2.

## 3. Anslut lunch.cloudidentity.se

1. Verifiera gärna domänen i GitHub-kontots **Settings → Pages** med den TXT-post GitHub ger dig. Behåll verifieringsposten.
2. Skriv **lunch.cloudidentity.se** i repositoryts **Settings → Pages → Custom domain** och spara **innan** du ändrar DNS.
3. Skapa följande DNS-post där DNS för `cloudidentity.se` hanteras:

| Typ | Namn | Värde |
|---|---|---|
| CNAME | lunch | DITT-GITHUB-ANVÄNDARNAMN.github.io |

Byt `DITT-GITHUB-ANVÄNDARNAMN` mot kontots eller organisationens verkliga namn. Målet ska inte innehålla `https://` eller repositorynamnet. Om leverantören kräver hela namnet använder du `lunch.cloudidentity.se` i namnfältet.

Ändra enbart poster som gäller subdomänen `lunch`; huvuddomän och e-post behöver inte ändras. Eventuella gamla A/AAAA/CNAME-poster för just `lunch` måste ersättas av rätt CNAME-post.

4. Vänta tills GitHub godkänt DNS och skapat certifikatet. Aktivera **Enforce HTTPS** när valet blir tillgängligt.
5. Öppna **https://lunch.cloudidentity.se**. DNS och certifikat kan ta upp till ett dygn att bli klara.

Paketet innehåller redan rätt `CNAME`-fil, men inställningen på GitHub och DNS-posten måste också göras. Relativa filadresser gör att sidan även kan användas på GitHubs vanliga projektadress innan domänen är ansluten.

## Så fungerar uppdateringarna

- Varje måndag kl. 01.17–10.17 hämtas de sju restaurangernas offentliga menyer och priser en gång i timmen.
- Varje meny och pris hanteras separat. Vid timeout, HTTP-fel eller oläsbart innehåll behålls senast fungerande uppgift. Sidan visar när en sparad meny eller ett senast bekräftat pris används.
- Menydata och kontrolltid sparas i `data/menus.json` och versionshanteras på `main`.
- Sidan publiceras på nytt när menyinnehåll, veckodatum eller felstatus ändras. Enbart nya kontrolltider startar ingen publicering. Datumet på korten gäller därför datan i den **publicerade** versionen; senaste kontrollen finns under Actions och i datafilen.
- Knappen på sidan hämtar den senast publicerade datafilen. Den startar inte en GitHub-körning. För en omedelbar kontroll använder du **Run workflow**.
- Vid fel på publiceringen sparas inte dess markering, så nästa körning försöker publicera igen.
- Schemat fortsätter även när ingen besöker sidan. GitHub kan fördröja eller hoppa över schemakörningar vid hög belastning. Kontrollera Actions om data blir gammal; publika repositoryns scheman kan inaktiveras efter 60 dagars inaktivitet.
- Menyfel syns som varningar i körningen. Kod- och publiceringsfel gör körningen röd. Aktivera GitHubs aviseringar för misslyckade körningar om du vill bli meddelad.

## Köra lokalt (valfritt)

Installera Node.js 24 och kör följande i paketets rot:

```sh
npm ci
npm run test:menus
npm run menus:fetch
npm run build
npm run preview
```

Öppna adressen som förhandsvisningen skriver ut. `dist-pages` innehåller en komplett statisk webbplats. Öppna via en webbserver, inte genom att dubbelklicka på index.html.

## Ändra och underhålla

Restauranger finns i `lib/menus.ts`, menytolkningen i `lib/parse-menu.ts`, sidan i `app/page.tsx` och schemat i `.github/workflows/lunch-pages.yml`. Om en restaurang gör om sin webbplats kan tolkningen behöva uppdateras.

Kör `npm run test:menus` efter ändringar. En push till `main` bygger och publicerar sidan; dokumentations- och rena dataändringar är undantagna för att undvika onödiga körningar.

Dokumentation:
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

Den tidigare ChatGPT-hostade sidan ändras inte av detta paket. GitHub-publiceringen och måndagsschemat blir aktiva först när du har lagt upp paketet och aktiverat Pages och Actions.
