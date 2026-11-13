# -*- coding: utf-8 -*-
import sys, os, re, json
sys.path.insert(0, os.path.dirname(__file__))
from testes_dados import GRUPOS

AQUI = os.path.dirname(os.path.abspath(__file__))
CSS = open(os.path.join(AQUI, 'estilo.css'), encoding='utf-8').read()
paginas = {}
if os.path.exists(os.path.join(AQUI, 'paginas_roteiro.json')):
    paginas = json.load(open(os.path.join(AQUI, 'paginas_roteiro.json')))

def pg(chave):
    return str(paginas.get(chave, '…'))

total = sum(len(g[3]) for g in GRUPOS)
assert total == 88, total

sumario = ['<ul class="sumario">']
sumario.append('<li><a>Antes de começar: instalar, relatar, segunda conta</a><span class="pt"></span><span>%s</span></li>' % pg('antes'))
for letra, nome, desc, testes in GRUPOS:
    sumario.append('<li><a>%s. %s (testes %d a %d)</a><span class="pt"></span><span>%s</span></li>' % (letra, nome, testes[0][0], testes[-1][0], pg('g' + letra)))
sumario.append('<li><a>Como me mandar o resultado</a><span class="pt"></span><span>%s</span></li>' % pg('final'))
sumario.append('</ul>')

def teste_html(t):
    n, titulo, serve, antes, passos, esp = t
    ps = ''.join('<li>%s</li>' % p for p in passos)
    return f'''<div class="teste">
<div class="cab"><span class="num">{n}</span><span class="tt">{titulo}</span></div>
<div class="rot">Para que serve</div><p>{serve}</p>
<div class="rot">Antes</div><p>{antes}</p>
<div class="rot">Passos</div><ol>{ps}</ol>
<div class="rot">O que deve acontecer</div><div class="esp">{esp}</div>
<div class="ok"><span class="quad"></span> OK &nbsp;&nbsp;&nbsp; <span class="quad"></span> Falhou &mdash; anotar: <span class="anot"></span></div>
</div>'''

corpo = []
for letra, nome, desc, testes in GRUPOS:
    extra = ''
    if letra == 'O':
        extra = '''<div class="aviso"><b>Importante sobre o grupo O.</b> As notificações funcionam <b>a partir da versão 0.20.1</b>. Nas versões 0.20.0 e anteriores o arquivo do Firebase (que o Google exige para os avisos) não ia dentro do app, e os avisos não chegavam. Na 0.20.1 ele vem junto. Para estes testes, use a 0.20.1 e, quando o app perguntar \"Receber avisos?\", toque em <b>Permitir</b>.</div>'''
    corpo.append(f'<section class="grupo-cab"><h2>{letra}. {nome}</h2><p class="grupo-desc">{desc}</p>{extra}')
    corpo.append(''.join(teste_html(t) for t in testes))
    corpo.append('</section>')

html = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Roteiro de testes - Bodes do Asfalto 0.20.1</title>
<style>{CSS}</style></head><body>

<section class="capa">
<div class="marca">BODES DO ASFALTO</div>
<h1>Roteiro de testes no celular</h1>
<div class="sub">Versão 0.20.1 &middot; 13/11/2026</div>
<p>88 testes, em 16 grupos (A a P). Cada teste diz o que fazer, onde tocar e o que deve aparecer.</p>
<p class="meta">(2) = o teste precisa de uma segunda conta, de preferência em outro celular.</p>
</section>

<section class="secao"><h2>Sumário</h2>
{''.join(sumario)}
</section>

<section class="secao" id="antes"><h2>Antes de começar</h2>

<h3>1. Como instalar a versão de teste (arquivo .apk)</h3>
<p>Você vai baixar o app direto do GitHub, pelo celular Android. Leva uns 5 minutos.</p>
<ol>
<li>No celular, abra o navegador e entre no GitHub do projeto, na aba <b>Actions</b>.</li>
<li>Toque na execução mais recente que tenha um visto verde. O nome costuma ser o da montagem da versão de teste.</li>
<li>Role até o final da página, até a parte <b>Artifacts</b>.</li>
<li>Toque em <b>bodes-do-asfalto-preview</b>. O celular baixa um arquivo <b>.zip</b>.</li>
<li>Abra o arquivo .zip (no app <b>Arquivos</b> do celular, toque nele e escolha <b>Extrair</b>). Dentro tem um arquivo <b>.apk</b>.</li>
<li>Toque no arquivo <b>.apk</b>. Se o celular perguntar, toque em <b>Configurações</b> e ligue <b>Permitir desta fonte</b> para o app que você usou (navegador ou Arquivos). Volte e toque em <b>Instalar</b>.</li>
<li>Quando terminar, toque em <b>Abrir</b>.</li>
</ol>
<div class="caixa"><div class="tit">Se a versão antiga estiver instalada</div><p>Instale por cima, sem apagar. Seus dados ficam guardados na sua conta. Depois da instalação, confira em <b>Perfil</b>, no final da tela, que aparece <b>0.20.1</b>.</p></div>

<h3>2. Como relatar o resultado</h3>
<p>Para cada teste, mande três coisas:</p>
<ol>
<li>O <b>número</b> do teste (por exemplo, 28).</li>
<li><b>OK</b> se funcionou como descrito, ou <b>Falhou</b> se não funcionou.</li>
<li>Se falhou, um <b>print da tela</b> (aperte os botões de ligar e baixar volume ao mesmo tempo) e uma frase dizendo o que você viu.</li>
</ol>
<p>Exemplo: <i>\"28 Falhou. Toquei em Posto mais próximo e apareceu 'Nenhum posto por perto'. Estou em Várzea Grande. Print em anexo.\"</i></p>
<p>Você pode usar a linha <b>[ ] OK &nbsp; [ ] Falhou &mdash; anotar:</b> de cada teste, se imprimir este roteiro, ou só mandar as mensagens. Tudo bem pular um teste que você não consegue fazer: avise o número.</p>

<h3>3. Como ter uma segunda conta</h3>
<p>Os testes marcados com <b>(2)</b> precisam de duas pessoas ou de dois celulares.</p>
<ol>
<li>Pegue outro celular (de um amigo ou da família) e instale o mesmo arquivo .apk.</li>
<li>Use <u>outro e-mail</u>, que nunca tenha entrado no app. Pode ser um e-mail novo e gratuito.</li>
<li>No celular 2, toque em <b>Receber link de acesso</b>, abra o e-mail e toque no link (é o teste 6).</li>
<li>No seu celular (conta administradora), aprove o pedido em <b>Perfil → Aprovar irmãos</b> (teste 7).</li>
</ol>
<p>Chame o seu celular de <b>celular 1</b> e o outro de <b>celular 2</b>. Os testes dizem em qual deles tocar.</p>

<h3>4. Regras de segurança dos testes</h3>
<div class="aviso"><b>Nunca teste pilotando.</b> Os testes do grupo F (modo pilotando) devem ser feitos com o veículo parado, ou com você de garupa ou de passageiro. O SOS de teste não liga para ninguém sozinho, mas <b>não ligue de verdade para o 192 ou o 193</b> só para testar.</div>

<h3>5. Dica</h3>
<p>Faça os testes na ordem dos grupos: A e B primeiro (instalar e entrar), depois os outros. Os testes 32 e 70 dependem de outros (o 32 depois do grupo K; o 70 depois do 68).</p>
</section>

{''.join(corpo)}

<section class="secao" id="final"><h2>Como me mandar o resultado</h2>
<p>Quando terminar (ou quando cansar: pode mandar em partes), mande uma mensagem com esta lista preenchida.</p>
<ol>
<li>Escreva seu nome e o modelo do celular (por exemplo, \"Redmi Note 12\").</li>
<li>Escreva a versão que você testou (deve ser <b>0.20.1</b>).</li>
<li>Para cada teste, escreva o número e <b>OK</b> ou <b>Falhou</b>. Exemplo: \"1 OK, 2 OK, 3 OK, 4 Falhou\".</li>
<li>Para cada <b>Falhou</b>, mande um print e uma frase: o que você tocou, o que esperava e o que apareceu.</li>
<li>Se o app fechou sozinho, anote a <b>hora</b> e a <b>tela</b> (teste 88).</li>
<li>Mande tudo na mesma conversa com o desenvolvedor. Pode ser texto e prints, sem pressa.</li>
</ol>
<div class="caixa"><div class="tit">Modelo para copiar</div>
<p>Nome: ______________________ &nbsp; Celular: ______________________ &nbsp; Versão: 0.20.1</p>
<p>Testes OK: ______________________________________________________________</p>
<p>Testes que falharam (número e o que aconteceu):</p>
<div class="linha-resp"></div><div class="linha-resp"></div><div class="linha-resp"></div><div class="linha-resp"></div>
<p>Testes que não consegui fazer: _________________________________________</p>
</div>
<p>Obrigado, irmão. Cada teste ajuda a deixar o app mais seguro e mais fácil de usar para todos. TFA!</p>
</section>
</body></html>'''

out = os.path.join(AQUI, '..', 'src', 'Roteiro-de-testes-Bodes-0.20.1.html')
open(out, 'w', encoding='utf-8').write(html)
print('ok', out)
