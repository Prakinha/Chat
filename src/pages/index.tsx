import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import ReconnectingWebSocket from 'reconnecting-websocket';
import styles from "../styles/Home.module.scss";

const preHome: NextPage = () => {
  const router = useRouter();
  const [isReady, setIsReady] = useState<boolean>(false);
  type WebSocketType = WebSocket | ReconnectingWebSocket;

  const [ws, setWs] = useState<WebSocketType | null>(null);

  useEffect(() => {
    const socket = new ReconnectingWebSocket("ws://192.168.7.23:420");

    socket.onopen = () => {
      console.log("Conexão WebSocket estabelecida");
      const initMessage = JSON.stringify({ type: 'device', device: 'frontend' });
      socket.send(initMessage);
    };

    socket.onmessage = (event) => {
      const message = event.data;
      console.log("Mensagem recebida do servidor:", message);

      try {
        const data = JSON.parse(message);
        if (data.type === 'card') {
          handleCardUID(data.uid);
        } else if (data.type === 'message') {
          // Ao receber a mensagem "on", define isReady para true
          console.log("Mensagem 'on' recebida. Liberando a interface.");
          setIsReady(true);
        }
        
      } catch (e) {
        console.error('Erro ao processar a mensagem:', e);
      }
    };

    socket.onclose = () => {
      console.log("Conexão WebSocket fechada");
    };

    socket.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const handleCardUID = (uid: string) => {
    // Remover espaços em branco e converter para minúsculas, se necessário
    const cardUID = uid.trim().toLowerCase();

    if (cardUID === "c37137aa") {
      // Redirecionar para a página de usuário normal
      router.push("/123"); 
    } else if (cardUID === "3b5bb280") {
      // Redirecionar para a página do usuário estrangeiro
      router.push({
        pathname: "/123", 
        query: {
          stranger: true,
        },
      });
    } else {
      // UID não reconhecido
      alert("Cartão não reconhecido"); // Fazer a tela de pop-up
    }
  };

    return (
    <>
      <Head>
        <title>Apresente Suas Credenciais</title>
      </Head>
      <section className={styles.main}>
        {!isReady ? (
          <div className={styles.connecting}>
            <p className="textglow">Servidor Fora de Operacao...</p>
            {/* Opcional: Adicionar um spinner ou indicador visual */}
          </div>
        ) : (
          <div className={styles.ready}>
            <input
              type="text"
              placeholder="Aproxime o cartão"
              // O input pode não ser necessário se a entrada for via cartão
              disabled
              style={{ fontSize: 24, padding: '12px 20px', width: '100%' }}
              className="glow"
            />
            {/* Outros elementos que devem ser exibidos quando isReady é true */}
          </div>
        )}
      </section>
    </>
  );
};

export default preHome;
