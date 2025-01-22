const express = require('express');
const router = express.Router();
const dialogflow = require('@google-cloud/dialogflow');
const Demand = require('../models/demand');
const Order = require('../models/order');

const projectId = process.env.DIALOGFLOW_PROJECT_ID || 'sushi-y9bc';
const sessionClient = new dialogflow.SessionsClient();

router.post('/', async (req, res) => {
  try {
    if (req.body.queryInput) {
      try {
        const userText = req.body.queryInput.text.text;
        const sessionId = req.body.sessionId || 'session-' + Math.random().toString(36).substring(7);
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
        const request = {
          session: sessionPath,
          queryInput: {
            text: {
              text: userText,
              languageCode: 'es',
            },
          },
        };

        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;

        return res.json({
          fulfillmentMessages: result.fulfillmentMessages,
          sessionId: sessionId
        });
      } catch (dialogflowError) {
        return res.status(500).json({
          error: 'Error al procesar el mensaje',
          details: dialogflowError.message
        });
      }
    } else {
      const intentName = req.body.queryResult.intent.displayName;
      const parameters = req.body.queryResult.parameters;

      switch(intentName) {
        case 'BuscarSushi':
          try {
            const sushiType = parameters.sushitype;
            
            if (sushiType && sushiType !== '') {
              let demand = await Demand.findOne({ product: sushiType });
              
              if (demand) {
                demand.counter += 1;
                await demand.save();
              } else {
                demand = new Demand({
                  product: sushiType,
                  counter: 1
                });
                await demand.save();
              }
        
              const precio = getPrecio(sushiType);
        
              return res.json({
                fulfillmentMessages: [
                  {
                    text: {
                      text: [
                        `Información sobre ${sushiType}:`,
                        `🍱 ${sushiType} - $${precio}`
                      ]
                    }
                  },
                  {
                    payload: {
                      type: 'quick_replies',
                      text: '¿Qué te gustaría hacer ahora?',
                      data: [
                        {
                          structValue: {
                            fields: {
                              text: { stringValue: 'Quiero realizar un pedido' },
                              payload: { stringValue: 'HacerPedido' }
                            }
                          }
                        },
                        {
                          structValue: {
                            fields: {
                              text: { stringValue: 'Volver al Incio' },
                              payload: { stringValue: 'MenuInicio' }
                            }
                          }
                        }
                      ]
                    }
                  }
                ]
              });
            } else {
              return res.json({
                fulfillmentMessages: [
                  {
                    text: {
                      text: [
                        '🍱 ROLLS CLÁSICOS:',
                        '- California Roll - $800\n- Philadelphia Roll - $900\n- Sake Roll - $1000',
                        '🔥 ROLLS CALIENTES:',
                        '- Hot Roll - $950\n- Crunchy Roll - $1100',
                        '🌱 ROLLS VEGETARIANOS:',
                        '- Veggie Roll - $750\n- Cucumber Roll - $700',
                        '🎉 PROMOCIONES:',
                        '- Combo 2 rolls clásicos: $1500\n- Combo familiar (3 rolls): $2200'
                      ]
                    }
                  },
                  {
                    payload: {
                      type: 'quick_replies',
                      text: '¿Qué te gustaría hacer ahora?',
                      data: [
                        {
                          structValue: {
                            fields: {
                              text: { stringValue: 'Quiero realizar un pedido' },
                              payload: { stringValue: 'HacerPedido' }
                            }
                          }
                        },
                        {
                          structValue: {
                            fields: {
                              text: { stringValue: 'Volver al Inicio' },
                              payload: { stringValue: 'MenuInicio' }
                            }
                          }
                        }
                      ]
                    }
                  }
                ]
              });
            }
          } catch (dbError) {
            throw dbError;
          }

        case 'HacerPedido':
          try {            
            const sushiType = parameters.sushitype;
            const cantidad = parameters.cantidad;
            const direccion = parameters.direccion;

            if (sushiType && cantidad && direccion) {
              const precio = getPrecio(sushiType);
              const total = precio * cantidad;

              return res.json({
                fulfillmentMessages: [
                  {
                    text: {
                      text: [
                        '¡Perfecto! Confirmá tu pedido:',
                        `🍱 ${cantidad} ${sushiType} ($${precio} c/u)`,
                        `📍 Dirección: ${direccion}`,
                        `💰 Total: $${total}`,
                        '¿Confirmás el pedido?'
                      ]
                    }
                  }
                ]
              });
            }

            return res.json({
              fulfillmentMessages: [
                {
                  text: {
                    text: ['Necesito algunos datos más para tu pedido.']
                  }
                }
              ]
            });
          } catch (dbError) {
            throw dbError;
          }
          break;

          case 'ConfirmarPedido':
            try {
              const outputContexts = req.body.queryResult.outputContexts;
              const pedidoContext = outputContexts.find(context => 
                context.name.includes('hacerpedido-followup') || 
                context.name.includes('realizarpedido-followup')
              );
              
              if (!pedidoContext) {
                return res.json({
                  fulfillmentMessages: [{
                    text: {
                      text: ['Lo siento, no encontré los detalles del pedido.']
                    }
                  }]
                });
              }
    
              const sushiType = pedidoContext.parameters.sushitype;
              const cantidad = pedidoContext.parameters.cantidad;
              const direccion = pedidoContext.parameters.direccion;
              const precio = getPrecio(sushiType);
              const total = precio * cantidad;
    
              const newOrder = new Order({
                sushiType: sushiType,
                cantidad: cantidad,
                direccion: direccion,
                total: total
              });
    
              await newOrder.save();
    
              let demand = await Demand.findOne({ product: 'pedido' });
              if (demand) {
                demand.counter += 1;
                await demand.save();
              } else {
                demand = new Demand({
                  product: 'pedido',
                  counter: 1
                });
                await demand.save();
              }
    
              return res.json({
                fulfillmentMessages: [
                  {
                    text: {
                      text: [
                        '¡Gracias por tu pedido! 🎉',
                        'Resumen del pedido:',
                        `🍱 ${cantidad} ${sushiType} ($${precio} c/u)`,
                        `📍 Dirección: ${direccion}`,
                        `💰 Total: $${total}`,
                        'Tu pedido estará listo en aproximadamente 30 minutos.',
                        '¡Que lo disfrutes! 😊'
                      ]
                    }
                  }
                ]
              });
            } catch (error) {
              throw error;
            }
            break;
    
            case 'MenuPrincipal':
              try {
                const hora = new Date().getHours();
                let saludo;
                
                if (hora >= 5 && hora < 12) {
                  saludo = '¡Buenos días! 🌅';
                } else if (hora >= 12 && hora < 20) {
                  saludo = '¡Buenas tardes! ☀️';
                } else {
                  saludo = '¡Buenas noches! 🌙';
                }
              
                return res.json({
                  fulfillmentMessages: [
                    {
                      text: {
                        text: [
                          `${saludo} Bienvenido a Sushi Bot 🍱\n\n` +
                          'Puedo ayudarte con:\n' +
                          '1. 🍣 Ver nuestro menú y precios\n' +
                          '2. 📦 Hacer un pedido\n' +
                          '3. 🕒 Consultar horarios de atención\n' +
                          '4. 🛵 Información sobre delivery\n' +
                          '5. 💳 Medios de pago disponibles\n\n' 
                        ]
                      }
                    },
                    {
                      payload: {
                        type: 'quick_replies',
                        text: '¿Qué te gustaría hacer?',
                        data: [
                          {
                            structValue: {
                              fields: {
                                text: { stringValue: 'Quiero realizar un pedido' },
                                payload: { stringValue: 'HacerPedido' }
                              }
                            }
                          },
                          {
                            structValue: {
                              fields: {
                                text: { stringValue: 'Horarios de Atención' },
                                payload: { stringValue: 'ConsultaHorario' }
                              }
                            }
                          },
                          {
                            structValue: {
                              fields: {
                                text: { stringValue: 'Ver Menú' },
                                payload: { stringValue: 'BuscarSushi' }
                              }
                            }
                          },
                          {
                            structValue: {
                              fields: {
                                text: { stringValue: 'Información de Delivery' },
                                payload: { stringValue: 'ConsultaDelivery' }
                              }
                            }
                          }
                        ]
                      }
                    }
                  ],
                  outputContexts: req.body.queryResult.outputContexts.map(context => ({
                    name: context.name,
                    lifespanCount: 0
                  }))
                });
              } catch (error) {
                throw error;
              }
              break;

              case 'ConsultaHorario':
                try {
                  return res.json({
                    fulfillmentMessages: [
                      {
                        text: {
                          text: [
                            '🕒 Nuestro horario de atención es:',
                            'Lunes a Viernes: 11:30 a 15:00 y 19:30 a 23:30',
                            'Sábados y Domingos: 19:30 a 23:30'
                          ]
                        }
                      },
                      {
                        payload: {
                          type: 'quick_replies',
                          text: '¿Qué te gustaría hacer?',
                          data: [
                            {
                              structValue: {
                                fields: {
                                  text: { stringValue: 'Quiero realizar un pedido' },
                                  payload: { stringValue: 'HacerPedido' }
                                }
                              }
                            },
                            {
                              structValue: {
                                fields: {
                                  text: { stringValue: 'Volver al Inicio' },
                                  payload: { stringValue: 'MenuPrincipal' }
                                }
                              }
                            },
                            {
                              structValue: {
                                fields: {
                                  text: { stringValue: 'Ver Menú' },
                                  payload: { stringValue: 'BuscarSushi' }
                                }
                              }
                            },
                            {
                              structValue: {
                                fields: {
                                  text: { stringValue: 'Información de Delivery' },
                                  payload: { stringValue: 'ConsultaDelivery' }
                                }
                              }
                            }
                          ]
                        }
                      }
                    ],
                    outputContexts: req.body.queryResult.outputContexts.map(context => ({
                      name: context.name,
                      lifespanCount: 0
                    }))
                  });
                } catch (error) {
                  throw error;
                }
                break;
              
                case 'ConsultaDelivery':
                  try {
                    return res.json({
                      fulfillmentMessages: [
                        {
                          text: {
                            text: [
                              '🛵 Información sobre delivery:',
                              '- Hacemos entregas a domicilio en toda la zona',
                              '- El envío es gratuito en un radio de 3km',
                              '- Tiempo estimado de entrega: 30-45 minutos'
                            ]
                          }
                        },
                        {
                          payload: {
                            type: 'quick_replies',
                            text: '¿Qué te gustaría hacer?',
                            data: [
                              {
                                structValue: {
                                  fields: {
                                    text: { stringValue: 'Quiero realizar un pedido' },
                                    payload: { stringValue: 'ParaHacerPedido' }
                                  }
                                }
                              },
                              {
                                structValue: {
                                  fields: {
                                    text: { stringValue: 'Volver al Inicio' },
                                    payload: { stringValue: 'ParaMenuInicio' }
                                  }
                                }
                              },
                              {
                                structValue: {
                                  fields: {
                                    text: { stringValue: 'Ver Menú' },
                                    payload: { stringValue: 'ParaBuscarSushi' }
                                  }
                                }
                              },
                              {
                                structValue: {
                                  fields: {
                                    text: { stringValue: 'Horarios de Atención' },
                                    payload: { stringValue: 'ParaConsultaHorario' }
                                  }
                                }
                              }
                            ]
                          }
                        }
                      ],
                      outputContexts: req.body.queryResult.outputContexts.map(context => ({
                        name: context.name,
                        lifespanCount: 0
                      }))
                    });
                  } catch (error) {
                    throw error;
                  }
                  break;
              
                  case 'ConsultaMediosPago':
                    try {
                      return res.json({
                        fulfillmentMessages: [
                          {
                            text: {
                              text: [
                                '💳 Aceptamos los siguientes medios de pago:',
                                '- Efectivo',
                                '- Tarjetas de débito y crédito',
                                '- Mercado Pago',
                                '- Transferencia bancaria'
                              ]
                            }
                          },
                          {
                            payload: {
                              type: 'quick_replies',
                              text: '¿Qué te gustaría hacer?',
                              data: [
                                {
                                  structValue: {
                                    fields: {
                                      text: { stringValue: 'Quiero realizar un pedido' },
                                      payload: { stringValue: 'HacerPedido' }
                                    }
                                  }
                                },
                                {
                                  structValue: {
                                    fields: {
                                      text: { stringValue: 'Volver al Menú Principal' },
                                      payload: { stringValue: 'MenuPrincipal' }
                                    }
                                  }
                                },
                                {
                                  structValue: {
                                    fields: {
                                      text: { stringValue: 'Ver Menú' },
                                      payload: { stringValue: 'BuscarSushi' }
                                    }
                                  }
                                }
                              ]
                            }
                          }
                        ],
                        outputContexts: req.body.queryResult.outputContexts.map(context => ({
                          name: context.name,
                          lifespanCount: 0
                        }))
                      });
                    } catch (error) {
                      throw error;
                    }
                    break;

        default:
          return res.json({
            fulfillmentMessages: [
              {
                text: {
                  text: ['Lo siento, no pude entender tu solicitud. ¿Podrías reformularla?']
                }
              }
            ]
          });
      }
    }
  } catch (error) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: ['Lo siento, hubo un error al procesar tu solicitud.']
          }
        }
      ]
    });
  }
});

function getPrecio(sushiType) {
  const precios = {
    'California Roll': 800,
    'Philadelphia Roll': 900,
    'Sake Roll': 1000,
    'Hot Roll': 950,
    'Crunchy Roll': 1100,
    'Veggie Roll': 750,
    'Cucumber Roll': 700
  };
  return precios[sushiType] || 0;
}

router.get('/stats', async (req, res) => {
  try {
    const demands = await Demand.find().sort('-counter');
    res.json({
      message: 'Estadísticas de demanda',
      data: demands
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort('-fechaPedido');
    res.json({
      message: 'Lista de pedidos',
      data: orders
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.get('/', (req, res) => {
  res.json({ message: 'Webhook está funcionando' });
});

module.exports = router;