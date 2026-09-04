# Dashboard de Clima — Open-Meteo (sem API key)

Esta pasta contém uma versão do dashboard que não exige chave de API. Ela usa:
- Nominatim (OpenStreetMap) para geocoding (cidade -> lat/lon)
- Open-Meteo para dados meteorológicos (current_weather + daily)

Observações importantes:
- Nominatim tem políticas de uso e limites; para uso em produção considere hospedar seu próprio serviço ou usar um provedor com chave.
- A versão é útil para demonstração / ambientes com restrição de chaves.

Como usar:
1. Faça upload da pasta `tools/weather-open-meteo` para seu servidor ou Hostinger.
2. Abra `index.html` no navegador.
3. Teste busca por cidade e geolocalização.

Melhorias possíveis:
- Adicionar ícones gráficos em vez de emojis
- Mapear mais campos (umidade, pressão) via outros endpoints
- Implementar cache mais robusto e limitador de chamadas ao Nominatim

Licença: MIT
